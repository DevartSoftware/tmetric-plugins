class SignalRConnection extends ServerConnection {

    serviceUrl: string;

    hub: SignalR.Hub.Connection;

    hubProxy: SignalR.Hub.Proxy;

    hubConnected: boolean;

    userProfile: Models.UserProfile;

    accountToPost: number;

    retryInProgress: boolean;

    retryTimeout: number;

    retryPendingHandle: number;

    retryTimeStamp = new Date();

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

        let signalRInternal = (<any>$.signalR).fn;
        Object.defineProperty(signalRInternal, 'reconnectDelay', {
            configurable: true,
            get: () => {
                let delay = 3 + 24 * Math.random(); // 3..27 seconds
                return (delay * 1000) | 0; // Convert to integer milliseconds
            }
        });
    }

    init(options: any): Promise<void> {

        this.serviceUrl = options.serviceUrl;
        this.hub = $.hubConnection(options.signalRUrl);

        this.hub.disconnected(() => {
            this.expectedTimerUpdate = false;
            console.log('hub.disconnected');
            if (!this.disconnecting) {
                this.disconnect().then(() => {
                    this.setRetryPending(true);
                });
            }
        });

        this.hubProxy = this.hub.createHubProxy('timeTrackerHub');

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

    protected get canRetryConnection() {
        return !this.hubConnected && !this.retryInProgress;
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
                    this.hub.start({ pingInterval: null })
                        .then(() => {
                            //this.hub['disconnectTimeout'] = 1000; // for dev
                            this.hubConnected = true;
                            this.setRetryPending(false);
                            this.hubProxy.invoke('register', profile.userProfileId)
                                .then(() => callback(profile))
                                .fail(reject);
                        })
                        .fail(reject);
                })
                .catch(e => {
                    console.log('connect: getProfile failed');
                    reject(e);
                });
        });
    }

    disconnect() {
        this.disconnecting = true;
        var promise = new Promise<void>((callback, reject) => {
            if (this.hubConnected) {
                this.hubConnected = false;
                this.onUpdateTimer.emit(null);
                console.log('disconnect: stop hub');
                this.hub.stop(false);
            }
            console.log('disconnect: disable retrying');
            this.setRetryPending(false);
            callback();
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