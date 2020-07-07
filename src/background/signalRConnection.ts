class SignalRConnection extends ServerConnection {

    serviceUrl: string;

    signalRUrl: string;

    hub: signalR.HubConnection;

    hubProxy = new SignalRHubProxy();

    hubConnected: boolean;

    userProfile: Models.UserProfile;

    accountToPost: number;

    private readonly minRetryInterval = 15000; // 15 seconds

    private readonly maxRetryInterval = 90000; // 1.5 mins

    private readonly intervalMultiplier = 1.25;

    private readonly intervalMultiplierTimeout = 5 * 60000; // 5 mins

    retryInProgress: boolean;

    private _retryTimeout: number;

    private _retryTimeoutHandle: number;

    private _retryTimeStamp = new Date();

    expectedTimerUpdate = false;

    disconnecting = false;

    serverApiVersion: number;

    onUpdateActiveAccount = SimpleEvent.create<number>();

    onInvalidateAccountScopeCache = SimpleEvent.create<number>();

    onRemoveExternalIssuesDurations = SimpleEvent.create<WebToolIssueIdentifier[]>();

    onUpdateTimer = SimpleEvent.create<Models.TimerEx>();

    onUpdateTracker = SimpleEvent.create<Models.TimeEntry[]>();

    onUpdateProfile = SimpleEvent.create<Models.UserProfile>();

    constructor() {

        super();
    }

    init(options: any): Promise<void> {

        this.serviceUrl = options.serviceUrl;
        this.signalRUrl = options.signalRUrl;
        OidcClient.init(options.authorityUrl);

        this.hubProxy.on('updateTimer', (accountId: number) => {
            if (this.userProfile && accountId != this.userProfile.activeAccountId) {
                return;
            }

            console.log('updateTimer: ' + this.expectedTimerUpdate);

            if (this.expectedTimerUpdate) {
                this.expectedTimerUpdate = false;
                this.getData();
            }
            else {
                // timer changed from outside - check that profile still the same
                this.isProfileChanged().then(isProfileChanged => {
                    if (isProfileChanged) {
                        this.reconnect();
                    }
                    else {
                        this.getData();
                    }
                });
            }
        });

        this.hubProxy.on('updateActiveAccount', (accountId: number) => {
            this.onUpdateActiveAccount.emit(accountId);
            if (!this.userProfile || accountId != this.userProfile.activeAccountId) {
                this.reconnect();
            }
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this.hubProxy.on('updateAccount', (accountId: number) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this.hubProxy.on('updateProjects', (accountId: number) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this.hubProxy.on('updateClients', (accountId: number) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this.hubProxy.on('updateTags', (accountId: number) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this.hubProxy.on('updateExternalIssuesDurations', (accountId: number, identifiers: WebToolIssueIdentifier[]) => {
            if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                this.onRemoveExternalIssuesDurations.emit(identifiers);
            }
        });

        return this.reconnect().catch(() => { });
    }

    private get canRetryConnection() {
        return !this.hubConnected && !this.retryInProgress;
    }

    isConnectionRetryEnabled() {
        console.log('retryPending: ' + !!this.retryPendingHandle + ', retryInProgress: ' + !!this.retryInProgress);
        return Promise.resolve(!!(this.retryPendingHandle || this.retryInProgress));
    }

    reconnect() {
        console.log('reconnect');
        return this.disconnect()
            .then(() => this.connect())
            .then(() => this.getData())
            .then(() => undefined);
    }

    connect() {

        console.log('connect');
        return new Promise<Models.UserProfile>((callback, reject) => {

            if (this.hubConnected) {
                console.log('connect: hubConnected');
                callback(this.userProfile);
                return;
            }

            this.waitAllRejects([this.getVersion(), this.getProfile()])
                .then(([version, profile]) => {

                    if (!this.hub) {
                        let hub = new signalR.HubConnectionBuilder()
                            .withUrl(this.signalRUrl + 'appHub')
                            .configureLogging(signalR.LogLevel.Warning)
                            .build();
                        hub.onclose(() => {
                            this.hubProxy.onDisconnect(hub);
                            this.expectedTimerUpdate = false;
                            console.log('hub.disconnected');
                            if (!this.disconnecting) {
                                this.disconnect().then(() => {
                                    this.setRetryPending(true);
                                });
                            }
                        });
                        this.hub = hub;
                    }

                    let hubPromise = Promise.resolve();
                    if (!this.hubProxy.isConnected) {
                        hubPromise = this.hub.start();
                        hubPromise.catch(() => this.setRetryPending(true));
                        hubPromise.then(() => this.hubProxy.onConnect(this.hub));
                    }

                    hubPromise
                        .then(() => {
                            this.hubConnected = true;
                            this.setRetryPending(false);
                            console.log('connect: register');
                            return this.hub.invoke('register', profile.userProfileId).then(() => callback(profile));
                        })
                        .catch(reject);
                })
                .catch(e => {
                    console.log('connect: getProfile failed');
                    reject(e);
                });
        });
    }

    setRetryPending(value: boolean) {

        console.log('setRetryPending: ' + value);

        if (!!this.retryPendingHandle == value) {
            return;
        }

        if (value) {
            var timeout = this._retryTimeout;
            var fromPreviousRetry = new Date().getTime() - this._retryTimeStamp.getTime();
            if (!timeout || timeout < this.minRetryInterval && fromPreviousRetry > this.intervalMultiplierTimeout) {
                timeout = this.minRetryInterval; // Start from 15 second interval when reconnected more than 5 mins ago
            } else {
                timeout = Math.min(timeout * this.intervalMultiplier, this.maxRetryInterval); // else increase interval up to 1.5 mins
            }
            this._retryTimeout = timeout;
            timeout *= 1 + Math.random(); // Random for uniform server load
            this._retryTimeoutHandle = setTimeout(() => {
                this._retryTimeoutHandle = null;
                this.retryConnection();
            }, timeout);
        } else if (this._retryTimeoutHandle) {
            clearTimeout(this._retryTimeoutHandle);
            this._retryTimeoutHandle = null;
        }
    }

    retryConnection() {
        console.log('retryConnection');
        this.setRetryPending(false);
        if (this.canRetryConnection) {
            this.retryInProgress = true;
            this.reconnect()
                .catch((err: AjaxStatus) => {
                    // Stop retrying when server returns error code
                    if (!(err.statusCode > 0)) {
                        this.setRetryPending(true);
                    }
                })
                .then(() => this.retryInProgress = false);
        }
        return Promise.resolve();
    }

    disconnect() {
        this.disconnecting = true;

        let disconnectPromise: Promise<void>;
        if (!this.hubConnected) {
            disconnectPromise = Promise.resolve();
        } else {
            this.hubConnected = false;
            this.onUpdateTimer.emit(null);
            console.log('disconnect: stop hub');
            disconnectPromise = this.hub.stop();
        }
        let promise = disconnectPromise.then(() => {
            console.log('disconnect: disable retrying');
            this.setRetryPending(false);
        });

        promise.then(() => this.disconnecting = false);
        promise.catch(() => this.disconnecting = false);
        return promise;
    }

    async getProfile() {
        let profile = await super.getProfile();
        this.onUpdateProfile.emit(profile);
        return profile;
    }

    getData() {

        return this.checkProfile().then(profile => {

            var accountId = profile.activeAccountId;
            var userProfileId = profile.userProfileId;

            var url = this.getTimerUrl(accountId);
            var timer = this.get<Models.TimerEx>(url).then(timer => {
                this.onUpdateTimer.emit(timer);
                return timer;
            });

            var now = new Date();
            var startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toJSON();
            var endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toJSON();
            url = this.getTimeEntriesUrl(accountId, userProfileId) + `?startTime=${startTime}&endTime=${endTime}`;
            var timeEntries = this.get<Models.TimeEntry[]>(url).then(timeEntries => {
                this.onUpdateTracker.emit(timeEntries);
                return timeEntries;
            });

            var all = Promise.all([timer, timeEntries]);
            all.catch(() => this.disconnect());

            return all;
        });
    }
}

{
    let p: { invokeClientMethod: (this: signalR.HubConnection, message: signalR.InvocationMessage) => void };
    p = <any>signalR.HubConnection.prototype;
    const oldInvoke = p.invokeClientMethod;
    p.invokeClientMethod = function (message) {
        if (message && message.target) {
            const methods = (<any>this).methods;
            if (methods && !methods[message.target.toLowerCase()]) {
                this.on(message.target, () => {/* no handler, just remove warning  */ })
            }
        }
        oldInvoke.apply(this, arguments);
    };
}