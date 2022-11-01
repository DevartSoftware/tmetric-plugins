class ServerConnection<TClient extends AjaxClient = AjaxClient> {

    private readonly _serviceUrl: Promise<string>;

    private _accountToPost: number;

    protected userProfile: Models.UserProfile;

    protected expectedTimerUpdate = false;

    readonly ajaxClient: TClient;

    /** Like promise.all but reject is called after all promises are settled */
    protected readonly waitAllRejects = Promise.all;

    constructor(mainUrl: Promise<string>, ajaxClient: TClient) {

        this._serviceUrl = mainUrl;
        this.ajaxClient = ajaxClient;

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

    checkProfileChange() {
        return this.isProfileChanged().then(isProfileChanged => {
            if (isProfileChanged) {
                this.reconnect();
            }
        });
    }

    /** @virtual */
    reconnect() {
        console.log('reconnect');
        return this.disconnect()
            .then(() => this.connect())
            .then(() => undefined);
    }

    /** @virtual */
    disconnect() {
        return Promise.resolve();
    }

    putIssueTimer(timer: WebToolIssueTimer) {

        if (!timer.isStarted) {
            return this.putTimer(<Models.Timer>{ isStarted: false });
        }

        timer = Object.assign({}, timer);

        // Reset service url to post issue without external link (TE-540)
        if (!timer.issueUrl) {
            timer.serviceType = null
            timer.serviceUrl = null;
        }

        return this.connect().then(profile => {
            const accountId = this._accountToPost || profile.activeAccountId;
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

    async getIntegrations() {
        await this.checkProfile()
        return this.get<Models.IntegrationInfo[]>(this.getIntegrationsUrl());
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
                this.getIntegrationProjectUrl(this._accountToPost || profile.activeAccountId),
                identifier));
    }

    setAccountToPost(accountId: number) {
        return new Promise<void>(callback => {
            this._accountToPost = accountId;
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

    /** @virtual */
    getData(): Promise<any> {
        return this.checkProfile();
    }

    protected isProfileChanged() {
        const previousProfileId = this.userProfile && this.userProfile.userProfileId;
        return this.getProfile().then(profile => profile.userProfileId != previousProfileId);
    }

    /** @virtual */
    protected connect() {

        console.log('connect');
        return new Promise<Models.UserProfile>((callback, reject) => {

            this.waitAllRejects([this.getVersion(), this.getProfile()])
                .then(([, profile]) => {
                    callback(profile);
                })
                .catch(e => {
                    console.log('connect: getProfile failed');
                    reject(e);
                });
        });
    }

    protected checkProfile() {
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

    /** @virtual */
    protected getProfile() {
        const profile = this.get<Models.UserProfile>('api/userprofile').then(profile => {
            this.userProfile = profile;
            return profile;
        });
        profile.catch(() => this.disconnect());
        return profile;
    }

    protected getVersion() {
        return this.get<number>('api/version')
    }

    protected async get<TRes>(url: string): Promise<TRes> {
        const serviceUrl = await this._serviceUrl;
        return await this.ajaxClient.ajax(serviceUrl + url, 'GET');
    }

    protected async post<TReq, TRes = void>(url: string, data: TReq): Promise<TRes> {
        const serviceUrl = await this._serviceUrl;
        return await this.ajaxClient.ajax<TReq, any>(serviceUrl + url, 'POST', data);
    }

    protected async put<TReq>(url: string, data: TReq): Promise<void> {
        const serviceUrl = await this._serviceUrl;
        return await this.ajaxClient.ajax<TReq, void>(serviceUrl + url, 'PUT', data);
    }

    protected getTimerUrl(accountId: number) {
        return `api/accounts/${accountId}/timer`;
    }

    protected getTimeEntriesUrl(accountId: number, userProfileId: number) {
        return `api/accounts/${accountId}/timeentries/${userProfileId}`;
    }

    private getIntegrationsUrl() {
        return `api/userprofile/integrations`;
    }

    private getIntegrationProjectUrl(accountId: number) {
        return `api/accounts/${accountId}/integrations/project`;
    }

    private getIssueTimerUrl(accountId: number) {
        return `api/accounts/${accountId}/timer/issue`;
    }

    private getTimeEntriesSummaryUrl(accountId: number) {
        return `api/accounts/${accountId}/timeentries/external/summary`;
    }

    private putTimer(timer: Models.Timer) {
        return this.connect().then(profile => {

            const accountId = this._accountToPost || profile.activeAccountId;
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

    private objToParams(obj: any) {
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
}