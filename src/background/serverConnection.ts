class ServerConnection {

    serviceUrl: string;

    userProfile: Models.UserProfile;

    accountToPost: number | null = null;

    expectedTimerUpdate = false;

    serverApiVersion: number;

    /** Like promise.all but reject is called after all promises are settled */
    waitAllRejects = Promise.all;

    constructor() {

        this.waitAllRejects = <any>((promises: Promise<any>[]) => new Promise((resolve, reject) => {

            let error = null;
            let pendingCounter = promises.length;

            promises.forEach(p => p
                .catch((e) => {
                    if (error == null) {
                        error = e != null ? e : 'failed';
                    }
                })
                .then(() => {
                    pendingCounter--;
                    if (!pendingCounter && error != null) {
                        reject(error);
                    }
                }));

            Promise.all(promises)
                .then(r => resolve(r))
                .catch(() => { });
        }));
    }

    init(options: any): Promise<void> {

        this.serviceUrl = options.serviceUrl;
        OidcClient.init(options.authorityUrl);

        return this.reconnect().catch(() => { });
    }

    isProfileChanged() {
        const previousProfileId = this.userProfile && this.userProfile.userProfileId;
        return this.getProfile().then(profile => profile.userProfileId != previousProfileId);
    }

    checkProfileChange() {
        return this.isProfileChanged().then(isProfileChanged => {
            if (isProfileChanged) {
                this.reconnect();
            }
        });
    }

    reconnect() {
        console.log('reconnect');
        return this.disconnect()
            .then(() => this.connect())
            .then(() => undefined);
    }

    connect() {

        console.log('connect');
        return new Promise<Models.UserProfile>((callback, reject) => {

            this.waitAllRejects([this.getVersion(), this.getProfile()])
                .then(([version, profile]) => {
                    callback(profile);
                })
                .catch(e => {
                    console.log('connect: getProfile failed');
                    reject(e);
                });
        });
    }

    disconnect() {
        return Promise.resolve();
    }

    putTimer(timer: Models.Timer) {
        return this.connect().then(profile => {

            const accountId = this.accountToPost || profile.activeAccountId;
            this.expectedTimerUpdate = true;

            const promise = this
                .put(this.getTimerUrl(accountId), timer)
                .then(() => this.checkProfileChange());

            promise.catch(() => {
                this.expectedTimerUpdate = false;
                this.checkProfileChange();
            });

            return promise;
        });
    }

    putIssueTimer(timer: WebToolIssueTimer) {

        if (!timer.isStarted) {
            return this.putTimer(<Models.Timer>{ isStarted: false });
        }

        timer = Object.assign({}, timer);

        // Reset service url to post issue without external link (TE-540)
        if (!timer.issueUrl) {
            timer.serviceType = undefined;
            timer.serviceUrl = undefined;
        }

        return this.connect().then(profile => {
            const accountId = this.accountToPost || profile.activeAccountId;
            this.expectedTimerUpdate = true;
            const promise = this.post(this.getIssueTimerUrl(accountId), timer).then(() => {
                this.checkProfileChange();
            });
            promise.catch(() => {
                this.expectedTimerUpdate = false;
                this.checkProfileChange();
            });
            return promise;
        });
    }

    getIntegrations() {
        return this.checkProfile().then(profile =>
            this.get<Models.IntegrationInfo[]>(
                this.getIntegrationsUrl()
            ));
    }

    objToParams(obj: any) {
        const params = new URLSearchParams();
        for (let name in obj) {
            let value = obj[name];
            if (Array.isArray(value)) {
                for (let item of value) {
                    params.append(name, item);
                }
            } else if (value != null) {
                params.set(name, value)
            }
        }
        return params.toString();
    }

    getIntegration(identifier: Models.IntegratedProjectIdentifier, accountId?: number, keepAccount?: boolean) {
        return this.checkProfile().then(profile => {
            const url = this.getIntegrationProjectUrl(accountId || profile.activeAccountId);
            const params = this.objToParams(Object.assign({ keepAccount }, identifier));
            return this.get<Models.IntegratedProjectStatus>(url + '?' + params);
        });
    }

    postIntegration(identifier: Models.IntegratedProjectIdentifier) {
        return this.checkProfile().then(profile =>
            this.post<Models.IntegratedProjectIdentifier>(
                this.getIntegrationProjectUrl(this.accountToPost || profile.activeAccountId),
                identifier));
    }

    setAccountToPost(accountId: number | null) {
        return new Promise<void>(callback => {
            this.accountToPost = accountId;
            callback();
        });
    }

    fetchIssuesDurations(identifiers: WebToolIssueIdentifier[]) {
        console.log('fetchIssuesDurations', identifiers);
        return this.checkProfile().then(profile =>
            this.post<WebToolIssueIdentifier[], WebToolIssueDuration[]>(
                this.getTimeEntriesSummaryUrl(profile.activeAccountId),
                identifiers));
    }

    checkProfile() {
        return new Promise<Models.UserProfile>((callback, reject) => {
            const profile = this.userProfile;
            if (profile && profile.activeAccountId) {
                callback(profile);
            }
            else {
                reject(invalidProfileError);
            }
        });
    }

    getProfile() {
        const profile = this.get<Models.UserProfile>('api/userprofile').then(profile => {
            this.userProfile = profile;
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
            const accountId = profile.activeAccountId;
            const url = this.getTimerUrl(accountId);
            return this.get<Models.TimerEx>(url);
        });
    }

    getAccountScope(accountId?: number) {
        return this.checkProfile().then(profile => {
            if (!accountId) {
                accountId = profile.activeAccountId;
            }
            const url = 'api/accounts/' + accountId + '/scope';
            return this.get<Models.AccountScope>(url);
        });
    }

    getRecentWorkTasks(accountId: number) {
        const url = 'api/accounts/' + accountId + '/timeentries/recent';
        return this.get<Models.RecentWorkTask[]>(url);
    }

    getData(): Promise<any> {
        return this.checkProfile();
    }

    get<TRes>(url: string): Promise<TRes> {
        return OidcClient.ajax(this.serviceUrl + url, 'GET');
    }

    post<TReq, TRes>(url: string, data: TReq): Promise<TRes>
    post<TReq>(url: string, data: TReq): Promise<void>
    post<TReq>(url: string, data: TReq): Promise<any> {
        return OidcClient.ajax<TReq, any>(this.serviceUrl + url, 'POST', data);
    }

    put<TReq>(url: string, data: TReq): Promise<void> {
        return OidcClient.ajax<TReq, void>(this.serviceUrl + url, 'PUT', data);
    }

    getIntegrationsUrl() {
        return `api/userprofile/integrations`;
    }

    getIntegrationProjectUrl(accountId: number) {
        return `api/accounts/${accountId}/integrations/project`;
    }

    getTimerUrl(accountId: number) {
        return `api/accounts/${accountId}/timer`;
    }

    getIssueTimerUrl(accountId: number) {
        return `api/accounts/${accountId}/timer/issue`;
    }

    getTimeEntriesUrl(accountId: number, userProfileId: number) {
        return `api/accounts/${accountId}/timeentries/${userProfileId}`;
    }

    getTimeEntriesSummaryUrl(accountId: number) {
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