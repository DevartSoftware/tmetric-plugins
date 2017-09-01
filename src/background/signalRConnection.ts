class SignalRConnection {

    url: string;

    hub: HubConnection;

    hubProxy: HubProxy;

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

    onRemoveExternalIssuesDurations = SimpleEvent.create<Integrations.WebToolIssueIdentifier[]>();

    onUpdateTimer = SimpleEvent.create<Models.Timer>();

    onUpdateTracker = SimpleEvent.create<Models.TimeEntry[]>();

    onUpdateProfile = SimpleEvent.create<Models.UserProfile>();

    onUpdateAccount = SimpleEvent.create<Models.Account>();

    onUpdateProjects = SimpleEvent.create<Models.Project[]>();

    onUpdateTags = SimpleEvent.create<Models.Tag[]>();

    init(url: string): Promise<void> {

        this.url = url;
        this.hub = $.hubConnection(url);

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
                this.getTimer();
            }
            else {
                // timer changed from outside - check that profile still the same
                this.isProfileChanged().then(isProfileChanged => {
                    if (isProfileChanged) {
                        this.reconnect();
                    }
                    else {
                        this.getTimer();
                    }
                });
            }
        });

        this.hubProxy.on('updateActiveAccount', (accountId: number) => {
            this.onUpdateActiveAccount.emit(accountId);
            if (!this.userProfile || accountId != this.userProfile.activeAccountId) {
                this.reconnect();
            }
        });

        this.hubProxy.on('updateAccount', (accountId: number) => {
            if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                this.getAccount();
            }
        });

        this.hubProxy.on('updateProjects', (accountId: number) => {
            if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                this.getProjects();
            }
        });

        this.hubProxy.on('updateTags', (accountId: number) => {
            if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                this.getTags();
            }
        });

        this.hubProxy.on('updateExternalIssuesDurations', (accountId: number, identifiers: Integrations.WebToolIssueIdentifier[]) => {
            if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                this.onRemoveExternalIssuesDurations.emit(identifiers);
            }
        });

        return this.reconnect().catch(() => { });
    }

    isProfileChanged() {
        let previousProfileId = this.userProfile && this.userProfile.userProfileId;
        return this.getProfile().then(profile => profile.userProfileId != previousProfileId);
    }

    checkProfileChange() {
        this.isProfileChanged().then(isProfileChanged => {
            if (isProfileChanged) {
                this.reconnect();
            }
        });
    }

    reconnect() {
        console.log('reconnect');
        return this.disconnect()
            .then(() => this.connect())
            .then(() => this.getTimer())
    }

    setRetryPending(isRetryPending: boolean) {

        console.log('setRetryPending: ' + isRetryPending);

        if (!!this.retryPendingHandle == isRetryPending) {
            return;
        }

        if (isRetryPending) {
            var timeout = this.retryTimeout;
            var fromPreviousRetry = new Date().getTime() - this.retryTimeStamp.getTime();
            if (!timeout || fromPreviousRetry > 5 * 60000) {
                timeout = 30000; // Start from 30 second interval when reconnected more than 5 mins ago
            }
            else {
                timeout = Math.min(timeout * 1.25, 90000); // else increase interval up to 1.5 mins
            }
            this.retryTimeout = timeout;
            timeout *= 1 + Math.random(); // Random for uniform server load
            //timeout = 3000; // for dev

            this.retryPendingHandle = setTimeout(() => this.retryConnection(), timeout);
        }
        else if (this.retryPendingHandle) {
            clearTimeout(this.retryPendingHandle);
            this.retryPendingHandle = null;
        }
    }

    retryConnection() {
        console.log('retryConnection');
        this.setRetryPending(false);
        if (!this.hubConnected && !this.retryInProgress) {
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

    isConnectionRetryEnabled() {
        console.log('retryPending: ' + !!this.retryPendingHandle + ', retryInProgress: ' + !!this.retryInProgress);
        return Promise.resolve(!!(this.retryPendingHandle || this.retryInProgress));
    }

    connect() {

        console.log('connect');
        return new Promise<Models.UserProfile>((callback, reject) => {

            if (this.hubConnected) {
                console.log('connect: hubConnected');
                callback(this.userProfile);
                return;
            }

            Promise.all([this.getVersion(), this.getProfile()])
                .then(([version, profile]) => {
                    Promise.all([this.getAccount(), this.getProjects(), this.getTags()])
                        .then(() => {
                            this.hub.start()
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
                        .catch(reject);
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

    putTimer(timer: Models.Timer) {
        return this.connect().then(profile => {

            let accountId = this.accountToPost || profile.activeAccountId;
            this.expectedTimerUpdate = true;

            let promise = this
                .put(this.getTimerUrl(accountId), timer)
                .then(() => this.checkProfileChange());

            promise.catch(() => {
                this.expectedTimerUpdate = false;
                this.checkProfileChange();
            });

            return promise;
        });
    }

    putExternalTimer(timer: Integrations.WebToolIssueTimer) {

        if (!timer.isStarted) {
            return this.putTimer(<Models.Timer>{ isStarted: false });
        }

        return this.connect().then(profile => {
            let accountId = this.accountToPost || profile.activeAccountId;
            this.expectedTimerUpdate = true;
            var promise = this.post(this.getExternalTimerUrl(accountId), timer).then(() => {
                this.checkProfileChange();
            });
            promise.catch(() => {
                this.expectedTimerUpdate = false;
                this.checkProfileChange();
            });
            return promise;
        });
    }

    getIntegration(identifier: Models.IntegratedProjectIdentifier) {
        return this.checkProfile().then(profile =>
            this.get<Models.IntegratedProjectStatus>(
                this.getIntegrationProjectUrl(profile.activeAccountId) + '?' + $.param(identifier, true)));
    }

    postIntegration(identifier: Models.IntegratedProjectIdentifier) {
        return this.checkProfile().then(profile =>
            this.post<Models.IntegratedProjectIdentifier>(
                this.getIntegrationProjectUrl(this.accountToPost || profile.activeAccountId),
                identifier));
    }

    setAccountToPost(accountId: number) {
        return new Promise<void>(callback => {
            this.accountToPost = accountId;
            callback();
        });
    }

    fetchIssuesDurations(identifiers: Integrations.WebToolIssueIdentifier[]) {
        console.log('fetchIssuesDurations', identifiers);
        return this.checkProfile().then(profile =>
            this.postWithPesponse<Integrations.WebToolIssueIdentifier[], Integrations.WebToolIssueDuration[]>(
                this.getTimeEntriesSummaryUrl(profile.activeAccountId),
                identifiers));
    }

    checkProfile() {
        return new Promise<Models.UserProfile>((callback, reject) => {
            var profile = this.userProfile;
            if (profile && profile.activeAccountId) {
                callback(profile);
            }
            else {
                reject();
            }
        });
    }

    getProfile() {
        var profile = this.get<Models.UserProfile>('api/userprofile').then(profile => {
            this.userProfile = profile;
            this.onUpdateProfile.emit(profile);
            return profile;
        });
        profile.catch(() => this.disconnect());
        return profile;
    }

    getVersion() {
        return this.get<number>('api/version').then(version => {
            this.serverApiVersion = version;
            return version;
        });
    }

    getTimer() {

        return this.checkProfile().then(profile => {

            var accountId = profile.activeAccountId;
            var userProfileId = profile.userProfileId;

            var url = this.getTimerUrl(accountId);
            var timer = this.get<Models.Timer>(url).then(timer => {
                this.onUpdateTimer.emit(timer);
                return timer;
            });

            var now = new Date();
            var startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toJSON();
            var endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toJSON();
            url = this.getTimeEntriesUrl(accountId, userProfileId) + `?startTime=${startTime}&endTime=${endTime}`;
            var tracker = this.get<Models.TimeEntry[]>(url).then(tracker => {
                this.onUpdateTracker.emit(tracker);
                return tracker;
            });

            var all = Promise.all([timer, tracker]).then(() => <void>undefined);
            all.catch(() => this.disconnect());
            return all;
        });
    }

    getAccount() {
        return this.checkProfile().then(profile => {
            let url = 'api/accounts/' + profile.activeAccountId;
            // TODO:
            //return this.get<Models.Account>(url).then(account => {
            //    this.onUpdateAccount.emit(account);
            //    return account;
            //});
            return <Models.Account>{};
        });
    }

    getProjects() {
        return this.checkProfile().then(profile => {
            var url = 'api/accounts/' + profile.activeAccountId + '/projects?onlyTracked=true';
            return this.get<Models.Project[]>(url).then(projects => {
                this.onUpdateProjects.emit(projects);
                return projects;
            });
        });
    }

    getTags() {
        return this.checkProfile().then(profile => {
            var url = 'api/accounts/' + profile.activeAccountId + '/tags';
            return this.get<Models.Tag[]>(url).then(tags => {
                this.onUpdateTags.emit(tags);
                return tags;
            });
        });
    }

    get<TRes>(url: string): Promise<TRes> {
        return this.ajax(url, 'GET');
    }

    post<TReq>(url: string, data: TReq): Promise<void> {
        return this.ajax<TReq, void>(url, 'POST', data);
    }

    postWithPesponse<TReq, TRes>(url: string, data: TReq): Promise<TRes> {
        return this.ajax<TReq, TRes>(url, 'POST', data);
    }

    put<TReq>(url: string, data: TReq): Promise<void> {
        return this.ajax<TReq, void>(url, 'PUT', data);
    }

    ajax<TReq, TRes>(url: string, method: string, dataReq?: TReq): Promise<TRes> {
        var settings = <JQueryAjaxSettings>{};
        settings.url = this.url + url;

        if (dataReq !== undefined) {
            settings.data = JSON.stringify(dataReq);
            settings.contentType = "application/json";
        }

        var isGet = method == 'GET';
        var isPost = method == 'POST';

        if (isGet || isPost) {
            settings.type = method;
        }
        else {
            settings.type = 'POST';
            settings.headers = {};
            settings.headers['X-HTTP-Method-Override'] = method;
        }

        return new Promise<TRes>((callback, reject) => {

            var xhr = $.ajax(settings);

            xhr.done(dataRes => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    callback(dataRes);
                }
                else {
                    reject(fail);
                }
            });

            xhr.fail(fail);

            function fail() {
                var statusCode = xhr.status;
                var statusText = xhr.statusText;
                if (statusText == 'error') // jQuery replaces empty status to 'error'
                {
                    statusText = '';
                }
                if (statusCode && !statusText) { // HTTP/2 does not define a way to carry the reason phrase
                    statusText = SignalRConnection.statusDescriptions[statusCode];
                }
                reject(<AjaxStatus>{ statusCode, statusText });
            }
        });
    }

    private getIntegrationProjectUrl(accountId: number) {
        return `api/accounts/${accountId}/integrations/project`;
    }

    private getTimerUrl(accountId: number) {
        return `api/accounts/${accountId}/timer`;
    }

    private getExternalTimerUrl(accountId: number) {
        return `api/accounts/${accountId}/timer/external`;
    }

    private getTimeEntriesUrl(accountId: number, userProfileId: number) {
        return `api/accounts/${accountId}/timeentries/${userProfileId}`;
    }

    private getTimeEntriesSummaryUrl(accountId: number) {
        return `api/accounts/${accountId}/timeentries/external/summary`;
    }

    static statusDescriptions = <{ [code: number]: string }>{
        100: "Continue",
        101: "Switching Protocols",
        102: "Processing",
        200: "OK",
        201: "Created",
        202: "Accepted",
        203: "Non-Authoritative Information",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",
        207: "Multi-Status",
        300: "Multiple Choices",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        305: "Use Proxy",
        307: "Temporary Redirect",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Request Entity Too Large",
        414: "Request-Uri Too Long",
        415: "Unsupported Media Type",
        416: "Requested Range Not Satisfiable",
        417: "Expectation Failed",
        422: "Unprocessable Entity",
        423: "Locked",
        424: "Failed Dependency",
        426: "Upgrade Required",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "Http Version Not Supported",
        507: "Insufficient Storage"
    }
}