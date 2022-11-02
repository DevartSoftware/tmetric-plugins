class SignalRConnection extends ServerConnection<OidcClient> {

    hub: signalR.HubConnection;

    private readonly _hubProxy = new SignalRHubProxy();

    private _hubConnected: boolean;

    private readonly minRetryInterval = 15000; // 15 seconds

    private readonly maxRetryInterval = 90000; // 1.5 mins

    private readonly intervalMultiplier = 1.25;

    private readonly intervalMultiplierTimeout = 5 * 60000; // 5 mins

    private _retryInProgress: boolean;

    private _retryTimeout: number;

    private _retryTimeoutHandle: number;

    private _retryTimeStamp = new Date();

    private _disconnectPromise: Promise<void>;

    private readonly _urls: Promise<{
        serviceUrl: string,
        authorityUrl: string,
        signalRUrl: string
    }>

    onUpdateActiveAccount = SimpleEvent.create<number>();

    onInvalidateAccountScopeCache = SimpleEvent.create<number>();

    onRemoveExternalIssuesDurations = SimpleEvent.create<WebToolIssueIdentifier[]>();

    onUpdateTimer = SimpleEvent.create<Models.TimerEx>();

    onUpdateTracker = SimpleEvent.create<Models.TimeEntry[]>();

    onUpdateProfile = SimpleEvent.create<Models.UserProfile>();

    constructor(urls: Promise<{
        serviceUrl: string,
        authorityUrl: string,
        signalRUrl: string
    }>) {
        super(
            urls.then(_ => _.serviceUrl),
            new OidcClient(urls.then(_ => _.authorityUrl)));
        this._urls = urls;

        this._hubProxy.on('updateTimer', (accountId: number) => {
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

        this._hubProxy.on('updateActiveAccount', (accountId: number) => {
            this.onUpdateActiveAccount.emit(accountId);
            if (!this.userProfile || accountId != this.userProfile.activeAccountId) {
                this.reconnect();
            }
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this._hubProxy.on('updateAccount', (accountId: number) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this._hubProxy.on('updateProjects', (accountId: number) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this._hubProxy.on('updateClients', (accountId: number) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this._hubProxy.on('updateTags', (accountId: number) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });

        this._hubProxy.on('updateExternalIssuesDurations', (accountId: number, identifiers: WebToolIssueIdentifier[]) => {
            if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                this.onRemoveExternalIssuesDurations.emit(identifiers);
            }
        });

        this.reconnect().catch(() => { });
    }

    get canRetryConnection() {
        return !this._hubConnected && !this._retryInProgress;
    }

    isConnectionRetryEnabled() {
        console.log('retryPending: ' + !!this._retryTimeoutHandle + ', retryInProgress: ' + !!this._retryInProgress);
        return Promise.resolve(!!(this._retryTimeoutHandle || this._retryInProgress));
    }

    override reconnect() {
        console.log('reconnect');
        return this.disconnect()
            .then(() => this.connect())
            .then(() => this.getData())
            .then(() => undefined);
    }

    protected override async connect() {

        console.log('connect');

        if (this._hubConnected) {
            console.log('connect: hubConnected');
            return this.userProfile;
        }

        try {
            const [, profile] = await this.waitAllRejects([this.getVersion(), this.getProfile()]);

            const urls = await this._urls;

            if (!this.hub) {
                const hub = new signalR.HubConnectionBuilder()
                    .withUrl(urls.signalRUrl + 'appHub')
                    .configureLogging(signalR.LogLevel.Warning)
                    .build();
                hub.onclose(() => {
                    this._hubProxy.onDisconnect(hub);
                    this.expectedTimerUpdate = false;
                    console.log('hub.disconnected');
                    this.disconnect().then(() => {
                        this.setRetryPending(true);
                    });
                });
                this.hub = hub;

                let hubPromise = Promise.resolve();
                if (!this._hubProxy.isConnected) {
                    hubPromise = this.hub.start();
                    hubPromise.catch(() => this.setRetryPending(true));
                    hubPromise.then(() => this._hubProxy.onConnect(this.hub));
                }

                await hubPromise;

                this._hubConnected = true;
                this.setRetryPending(false);
                console.log('connect: register');
                await this.hub.invoke('register', profile.userProfileId);
                return profile;
            }
        }
        catch (e) {
            console.log('connect: getProfile failed');
            throw e;
        }
    }

    private setRetryPending(value: boolean) {

        console.log('setRetryPending: ' + value);

        if (!!this._retryTimeoutHandle == value) {
            return;
        }

        if (value) {
            let timeout = this._retryTimeout;
            const fromPreviousRetry = new Date().getTime() - this._retryTimeStamp.getTime();
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

    retryConnection(wait?: boolean) {
        console.log(`retryConnection. hubConnected: ${this._hubConnected}, retryInProgress: ${this._retryInProgress}`);
        this.setRetryPending(false);
        if (this.canRetryConnection) {
            this._retryInProgress = true;
            const promise = this.reconnect()
                .catch((err: AjaxStatus) => {
                    // Stop retrying when server returns error code
                    if (!(err.statusCode > 0)) {
                        console.log(`Retry error: ${err.statusCode}`);
                        this.setRetryPending(true);
                    }
                })
                .then(() => {
                    this._retryInProgress = false;
                });
            if (wait) {
                return promise;
            }
        }
        return Promise.resolve();
    }

    override disconnect() {
        if (this._disconnectPromise) {
            return this._disconnectPromise;
        }

        let disconnectPromise: Promise<void>;
        if (!this._hubConnected) {
            disconnectPromise = Promise.resolve();
        } else {
            this._hubConnected = false;
            this.onUpdateTimer.emit(null);
            console.log('disconnect: stop hub');
            disconnectPromise = this.hub.stop();
        }
        const promise = disconnectPromise.then(() => {
            console.log('disconnect: disable retrying');
            this.setRetryPending(false);
        });

        this._disconnectPromise = promise;
        promise.then(() => this._disconnectPromise = undefined);
        promise.catch(() => this._disconnectPromise = undefined);
        return promise;
    }

    protected override async getProfile() {
        const profile = await super.getProfile();
        this.onUpdateProfile.emit(profile);
        return profile;
    }

    override getData() {

        return this.checkProfile().then(profile => {

            const accountId = profile.activeAccountId;
            const userProfileId = profile.userProfileId;

            let url = this.getTimerUrl(accountId);
            const timer = this.get<Models.TimerEx>(url).then(timer => {
                this.onUpdateTimer.emit(timer);
                return timer;
            });

            const now = new Date();
            const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toJSON();
            const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toJSON();
            url = this.getTimeEntriesUrl(accountId, userProfileId) + `?startTime=${startTime}&endTime=${endTime}`;
            const timeEntries = this.get<Models.TimeEntry[]>(url).then(timeEntries => {
                this.onUpdateTracker.emit(timeEntries);
                return timeEntries;
            });

            const all = Promise.all([timer, timeEntries]);
            all.catch(() => this.disconnect());

            return all;
        });
    }
}

{
    const p: { invokeClientMethod: (this: signalR.HubConnection, message: signalR.InvocationMessage) => void } =
        <any>signalR.HubConnection.prototype;

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