abstract class BackgroundBase {

    protected getDefaultConstants() {
        let constants: Models.Constants = {
            maxTimerHours: 12,
            extensionName: this.getExtensionName(),
            browserSchema: this.getBrowserSchema(),
            extensionUUID: this.getExtensionUUID(),
            serviceUrl: this.serviceUrl,
            storageUrl: this.storageUrl
        };
        return constants;
    }

    protected abstract getExtensionName(): string

    protected abstract getBrowserSchema(): string

    protected abstract getExtensionUUID(): string

    protected showError(message: string) {
        // This needed to prevent alert cleaning via build.
        let a = alert;
        a(message);
    }

    /**
     * Show push notification
     * @param message
     * @param title
     */
    protected abstract showNotification(message: string, title?: string)

    protected connection: ServerConnection;

    protected serviceUrl: string;

    protected storageUrl: string;

    protected _constants: Models.Constants;

    protected _actionOnConnect: () => void;

    protected _timer: Models.TimerEx;

    protected _newPopupIssue: WebToolIssueTimer;

    protected _newPopupAccountId: number;

    protected _userProfile: Models.UserProfile;

    private static defaultApplicationUrl = 'https://app.tmetric.com/';

    private static defaultStorageUrl = 'https://services.tmetric.com/storage/';

    constructor() {

        this.init();

        this.initConnection();

        this.listenPopupAction<IPopupParams, IPopupInitData>('initialize', this.initializePopupAction);
        this.listenPopupAction<void, void>('openTracker', this.openTrackerPagePopupAction);
        this.listenPopupAction<string, void>('openPage', this.openPagePopupAction);
        this.listenPopupAction<void, boolean>('isConnectionRetryEnabled', this.isConnectionRetryEnabledPopupAction);
        this.listenPopupAction<void, void>('retry', this.retryConnectionPopupAction);
        this.listenPopupAction<void, void>('login', this.loginPopupAction);
        this.listenPopupAction<void, void>('fixTimer', this.fixTimerPopupAction);
        this.listenPopupAction<IPopupTimerData, void>('putTimer', this.putTimerPopupAction);
        this.listenPopupAction<void, void>('hideAllPopups', this.hideAllPopupsPopupAction);
        this.listenPopupAction<IAccountProjectMapping, void>('saveProjectMap', this.saveProjectMapPopupAction);
        this.listenPopupAction<ITaskDescriptionMapping, void>('saveDescriptionMap', this.saveDescriptionMapPopupAction);
        this.listenPopupAction<void, void>('openOptionsPage', this.openOptionsPagePopupAction);
        this.listenPopupAction<number, Models.RecentWorkTask[]>('getRecentTasks', this.getRecentTasksAction);

        this.registerMessageListener();
    }

    protected init() {

        this.serviceUrl = this.normalizeUrlLastSlash(this.getTestValue('tmetric.url') || BackgroundBase.defaultApplicationUrl);
        this.storageUrl = this.normalizeUrlLastSlash(this.getTestValue('tmetric.storageUrl') || BackgroundBase.defaultStorageUrl);

        this._constants = this.getDefaultConstants();
    }

    protected initConnection() {

        this.connection = new ServerConnection();

        this.connection.init({ serviceUrl: this.serviceUrl });
    }

    protected async getProject(projectId: number, accountId?: number) {
        accountId = accountId || this._userProfile.activeAccountId;

        let scope = await this.getAccountScope(accountId);
        if (scope) {
            return scope.projects.find(_ => _.projectId == projectId);
        }
    }

    protected openTrackerPage() {
        let url = this.serviceUrl;
        if (this._userProfile && this._userProfile.activeAccountId) {
            url += '#/tracker/' + this._userProfile.activeAccountId + '/';
        }
        this.openPage(url);
    }

    protected isLongTimer() {
        return false;
    }

    protected fixTimer() {
        this.showNotification('You should fix the timer.');
        this.openTrackerPage();
    }

    protected putTimerWithIntegration(timer: WebToolIssueTimer, status: Models.IntegratedProjectStatus, requiredFields: Models.RequiredFields) {

        let notification: string;

        if (timer.projectName) {
            const contactAdmin = 'Please contact the account administrator to fix the problem.';

            if (status.projectStatus == null) {
                if (status.serviceRole != Models.ServiceRole.Admin &&
                    status.serviceRole != Models.ServiceRole.Owner &&
                    !status.canAddProject) {
                    // No rights to create project
                    timer.projectName = undefined;
                }
            }
            else if (status.projectStatus != Models.ProjectStatus.Open) {
                let statusText = status.projectStatus == Models.ProjectStatus.Archived ? 'archived' : 'done';
                notification = `Project '${timer.projectName}' exists, but it has '${statusText}' status. You cannot log time to this project.\n\n${contactAdmin}`;
                timer.projectName = undefined;
            }
            else if (status.projectRole == null) {
                notification = `Project '${timer.projectName}' exists, but you don't have access to the project.\n\n${contactAdmin}`;
                timer.projectName = undefined;
            }

            if (requiredFields.project && notification) {
                this.showNotification(notification);
                return;
            }
        }

        let promise = this.connection.setAccountToPost(status.accountId);

        if (!timer.serviceUrl != !status.integrationType || // integration existing or
            !timer.projectName != !status.projectStatus) {  // project existing differ

            // Integration or project does not exist
            promise = promise.then(() => this.connection.postIntegration(<Models.IntegratedProjectIdentifier>{
                serviceUrl: timer.serviceUrl,
                serviceType: timer.serviceType,
                projectName: timer.projectName,
                showIssueId: timer.showIssueId
            }));
        }

        promise = promise
            .then(() => {
                return this.connection.putIssueTimer(timer);
            })
            .then(() => {
                if (notification) {
                    this.showNotification(notification);
                }
            })
            .catch(status => {
                this.showError(this.getErrorText(status));
            })
            .then(() => {
                this.connection.setAccountToPost(null);
            });

        return promise;
    }

    protected getIntegrationStatus(timer: WebToolIssueTimer, accountId?: number) {
        return this.connection.getIntegration(<Models.IntegratedProjectIdentifier>{
            serviceUrl: timer.serviceUrl,
            serviceType: timer.serviceType,
            projectName: timer.projectName,
            showIssueId: !!timer.showIssueId
        }, accountId, !!accountId);
    }

    protected async putExternalTimer(timer: WebToolIssueTimer, accountId?: number) {

        // Stop timer without any checks (TE-339)
        if (!timer.isStarted) {
            timer = <WebToolIssueTimer>{ isStarted: false }
        }

        this.putData(timer, async timer => {

            try {
                var status = await this.getIntegrationStatus(timer, accountId);
                var scope = await this.getAccountScope(status.accountId);
            } catch (err) {
                return this.connection.checkProfileChange(); // TE-179
            }

            if (accountId) {
                return this.putTimerWithIntegration(timer, status, scope.requiredFields);
            }

            if (timer.isStarted) {

                // Set default work type before popup show (TE-299)
                await this.validateTimerTags(timer, status.accountId);

                this.validateTimerProject(timer, status);

                // This timer will be send when popup ask for initial data
                this._newPopupIssue = timer;

                // This account id will be used to prepare initial data for popup
                this._newPopupAccountId = status.accountId;

                return this.showPopup();
            }

            return this.putTimerWithIntegration(timer, status, scope.requiredFields);
        });
    }

    protected putData<T>(data: T, action: (data: T) => Promise<any>, retryAction?: (data: T) => Promise<any>) {

        let onFail = (status: AjaxStatus, showDialog: boolean) => {

            this._actionOnConnect = null;

            // Zero status when server is unavailable or certificate fails (#59755). Show dialog in that case too.
            if (!status || status.statusCode == HttpStatusCode.Unauthorized || status.statusCode == 0) {

                let disconnectPromise = this.connection.disconnect();

                if (showDialog) {
                    disconnectPromise.then(() => {
                        this._actionOnConnect = () => onConnect(false);
                        this.showLoginDialog();
                    });
                }
            }
            else {

                let error = this.getErrorText(status);

                if (status.statusCode == HttpStatusCode.Forbidden && retryAction) {
                    let promise = retryAction(data);
                    if (promise) {
                        promise.catch(() => this.showError(error));
                        return;
                    }
                }

                this.showError(error);
            }
        };

        let onConnect = (showDialog: boolean) => {

            if (this.isLongTimer()) {

                // ensure connection before page open to prevent login duplication (#67759)
                this._actionOnConnect = () => this.fixTimer();
                this.connection.getData().catch(status => onFail(status, showDialog));
                return;
            }

            action(data).catch(status => onFail(status, showDialog));
        };

        if (this._timer == null) {
            // connect before action to get actual state
            this._actionOnConnect = () => onConnect(true);
            this.connection.reconnect().catch(status => onFail(status, true));
        }
        else {
            onConnect(true);
        }
    }

    protected normalizeUrlLastSlash(url: string) {
        if (url[url.length - 1] != '/') {
            url += '/';
        }
        return url;
    }

    protected getErrorText(status: AjaxStatus) {
        let result = status && (status.responseMessage || status.statusText || status.statusCode);
        if (result) {
            return result.toString();
        }
        return 'Connection to the server failed or was aborted.';
    }

    protected async validateTimerTags(timer: WebToolIssueTimer, accountId?: number) {

        accountId = accountId || this._userProfile.activeAccountId;

        let scope = await this.getAccountScope(accountId);

        let hasWorkType = false;
        let tagByName: { [name: string]: Models.Tag } = {};
        scope.tags.forEach(tag => {
            tagByName[tag.tagName.toLowerCase()] = tag;
        });

        timer.tagNames = (timer.tagNames || [])
            .map(name => {

                let tag = tagByName[name.toLowerCase()];

                if (!tag) {
                    return name; // new tag
                }

                if (tag.isWorkType) {
                    if (hasWorkType) {
                        return null; // accept only first work type
                    }
                    hasWorkType = true;
                }

                return tag.tagName; // old tag (character case can be different)
            })
            .filter(name => !!name);

        if (!hasWorkType) {
            let defaultWorkType = await this.getDefaultWorkType(accountId);
            if (defaultWorkType) {
                timer.tagNames.push(defaultWorkType.tagName);
            }
        }
    }

    protected validateTimerProject(timer: WebToolIssueTimer, status: Models.IntegratedProjectStatus) {
        // Clear non open project to let user select another
        if (status.projectStatus != null &&
            status.projectStatus != Models.ProjectStatus.Open
        ) {
            timer.projectId = 0;
            timer.projectName = '';
        }
    }

    protected async getDefaultWorkType(accountId?: number) {

        accountId = accountId || this._userProfile.activeAccountId;

        let scope = await this.getAccountScope(accountId);
        let member = this._userProfile.accountMembership.find(_ => _.account.accountId == accountId);

        return scope.tags.find(tag => tag.tagId == member.defaultWorkTypeId);
    }

    protected async getRecentTasks(accountId?: number) {
        return await this.connection.getRecentWorkTasks(accountId || this._userProfile.activeAccountId);
    }

    // issues durations cache

    private _issuesDurationsCache: { [key: string]: WebToolIssueDuration } = {};

    private makeIssueDurationKey(identifier: WebToolIssueIdentifier) {
        return identifier.serviceUrl + '/' + identifier.issueUrl;
    }

    protected getIssueDurationFromCache(identifier: WebToolIssueIdentifier): WebToolIssueDuration {
        return this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
    }

    protected putIssuesDurationsToCache(durations: WebToolIssueDuration[]) {
        durations.forEach(duration => {
            this._issuesDurationsCache[this.makeIssueDurationKey(duration)] = duration;
        });
    }

    protected removeIssuesDurationsFromCache(identifiers: WebToolIssueIdentifier[]) {
        identifiers.forEach(identifier => {
            delete this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
        });
    }

    protected clearIssuesDurationsCache() {
        this._issuesDurationsCache = {};
    }

    protected getIssuesDurations(identifiers: WebToolIssueIdentifier[]): Promise<WebToolIssueDuration[]> {

        let durations = <WebToolIssueDuration[]>[];
        let fetchIdentifiers = <WebToolIssueIdentifier[]>[];

        // Do not show durations of tasks without url
        identifiers = identifiers.filter(_ => !!_.serviceUrl && !!_.issueUrl);

        identifiers.forEach(identifier => {
            let duration = this.getIssueDurationFromCache(identifier);
            if (duration) {
                durations.push(duration);
            }
            else {
                fetchIdentifiers.push(identifier);
            }
        });

        if (durations.length == identifiers.length) {
            return Promise.resolve(durations);
        }

        return new Promise<WebToolIssueDuration[]>(resolve => {
            this.connection.fetchIssuesDurations(fetchIdentifiers)
                .then(fetchDurations => {
                    this.putIssuesDurationsToCache(fetchDurations);
                    resolve(durations.concat(fetchDurations));
                })
                .catch(() => {
                    resolve([]);
                });
        });
    }

    // account scope cache

    private _accountScopeCache: { [key: number]: Promise<Models.AccountScope> } = {};

    protected invalidateAccountScopeCache(accountId: number) {
        delete this._accountScopeCache[accountId];
    }

    protected getAccountScope(accountId: number) {
        let scope = this._accountScopeCache[accountId];
        if (!scope) {
            scope = this._accountScopeCache[accountId] = this.connection.getAccountScope(accountId)

                // Legacy server
                .then(scope => {
                    scope.requiredFields = scope.requiredFields || <Models.RequiredFields>{};
                    return scope;
                })
        }
        return scope;
    }

    // popup action listeners

    private _popupActions = {};

    private listenPopupAction<TParams, TResult>(action: string, handler: (data: TParams) => Promise<TResult>) {
        this._popupActions[action] = handler;
    }

    protected onPopupRequest(request: IPopupRequest, callback: (response: IPopupResponse) => void) {
        let action = request.action;
        let handler = this._popupActions[action];
        if (action && handler) {
            handler.call(this, request.data).then((result: IPopupInitData) => {
                callback({ action: action, data: result });
            }).catch((error) => {
                callback({ action: action, error: error || 'Error' });
            });
        } else {
            callback({ action: action, error: 'Not found handler for action ' + action });
        }
    }

    // popup actions

    protected abstract showPopup(): void

    protected abstract hidePopup(): void

    private async getPopupData(params: IPopupParams) {

        let accountId = params.accountId;

        // get popup default data from account where project exist
        if (!accountId && this._newPopupAccountId) {
            accountId = this._newPopupAccountId;
        }

        // get default data from active account
        if (!this._userProfile.accountMembership.some(_ => _.account.accountId == accountId)) {
            accountId = this._userProfile.activeAccountId;
        }

        return Promise.all([
            this.getActiveTabTitle(),
            this.getAccountScope(accountId),
            this.getDefaultWorkType(accountId)
        ]).then(([title, scope, defaultWorkType]) => {

            let userRole = this._userProfile.accountMembership
                .find(_ => _.account.accountId == accountId)
                .role;

            let canMembersManagePublicProjects = scope.account.canMembersManagePublicProjects;
            let canCreateTags = scope.account.canMembersCreateTags;
            let isAdmin = (userRole == Models.ServiceRole.Admin || userRole == Models.ServiceRole.Owner);

            let newIssue = this._newPopupIssue || <WebToolIssueTimer>{ // _newPopupIssue is null if called from toolbar popup
                isStarted: true,
                description: title,
                tagNames: defaultWorkType ? [defaultWorkType.tagName] : []
            };

            let filteredProjects = this.getTrackedProjects(scope)
                .sort((a, b) => a.projectName.localeCompare(b.projectName, [], { sensitivity: 'base' }));

            const projectMap = this.getProjectMap(accountId);

            // Determine default project
            let defaultProjectId = <number>null;
            if (projectMap) {

                let projectName = newIssue.projectName || '';

                defaultProjectId = projectMap[projectName];

                // Remove mapped project from localstorage if project was deleted/closed
                if (defaultProjectId && filteredProjects.every(_ => _.projectId != defaultProjectId)) {
                    this.setProjectMap(accountId, projectName, null);
                    defaultProjectId = null;
                }
            }

            const descriptionMap = this.getDescriptionMap();

            if (newIssue.issueId && !newIssue.description && descriptionMap) {
                newIssue.description = descriptionMap[newIssue.issueName];
            }

            this._newPopupIssue = null;
            this._newPopupAccountId = null;

            return <IPopupInitData>{
                timer: this._timer,
                newIssue,
                profile: this._userProfile,
                accountId,
                projects: filteredProjects,
                clients: scope.clients,
                tags: scope.tags,
                canCreateProjects: isAdmin || canMembersManagePublicProjects,
                canCreateTags,
                constants: this._constants,
                defaultProjectId,
                requiredFields: scope.requiredFields
            };
        });
    }

    protected initializePopupAction(params: IPopupParams): Promise<IPopupInitData> {
        return new Promise((resolve, reject) => {
            // Forget about old action when user open popup again
            this._actionOnConnect = null;
            if (this._timer) {
                resolve(this.getPopupData(params));
            } else {
                reject('Not connected');
            }
        });
    }

    protected openTrackerPagePopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }

    protected openPagePopupAction(url) {
        return Promise.resolve(null).then(() => {
            this.openPage(url);
        });
    }

    protected isConnectionRetryEnabledPopupAction(): Promise<boolean> {
        return this.connection.isConnectionRetryEnabled();
    }

    protected retryConnectionPopupAction() {
        return this.connection.retryConnection();
    }

    protected abstract showLoginDialog(): void

    protected loginPopupAction() {
        return Promise.resolve(null).then(() => {
            this.connection.reconnect().catch(() => this.showLoginDialog());
        });
    }

    protected fixTimerPopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }

    protected putTimerPopupAction(data: IPopupTimerData) {
        return Promise.resolve(null).then(() => {
            this.putExternalTimer(data.timer, data.accountId);
        });
    }

    protected hideAllPopupsPopupAction() {
        return Promise.resolve(null).then(() => {
            this.hidePopup();
        });
    }

    protected getTestValue(name: string): any {
        return localStorage.getItem(name);
    }

    protected getActiveTabTitle() {
        return Promise.resolve(document.title);
    }

    protected openPage(url: string) {
        open(url);
    }

    protected abstract registerMessageListener(): void

    // account to project map

    private accountToProjectMap: {
        [accountId: number]: {
            [key: string]: number
        }
    };

    private accountToProjectMapKey = 'accountToProjectMap';

    private setProjectMap(accountId: number, projectName: string, projectId: number) {

        let map = this.getProjectMap(accountId);
        if (projectId) {
            map = map || {};
            map[projectName] = projectId;
            this.accountToProjectMap[accountId] = map;
        } else if (map) {
            delete map[projectName];
        }

        localStorage.setItem(this.accountToProjectMapKey, JSON.stringify(this.accountToProjectMap));
    }

    private getProjectMap(accountId: number) {

        if (!this.accountToProjectMap) {
            const obj = localStorage.getItem(this.accountToProjectMapKey);
            this.accountToProjectMap = obj ? JSON.parse(obj) : {};
        }

        return this.accountToProjectMap[accountId];
    }

    protected saveProjectMapPopupAction({ accountId, projectName, projectId }: IAccountProjectMapping) {
        this.setProjectMap(accountId, projectName, projectId);
        return Promise.resolve(null);
    }

    // task name to description map

    private taskNameToDescriptionMap: {
        [key: string]: string
    };

    private taskNameToDescriptionMapKey = 'taskNameToDescriptionMap';

    private setDescriptionMap(taskName: string, description: string) {
        let map = this.getDescriptionMap();
        if (description && description != taskName) {
            map = map || {};
            map[taskName] = description;
            this.taskNameToDescriptionMap = map;
        } else {
            delete map[taskName];
        }

        localStorage.setItem(this.taskNameToDescriptionMapKey, JSON.stringify(this.taskNameToDescriptionMap))
    }

    private getDescriptionMap() {
        if (!this.taskNameToDescriptionMap) {
            const obj = localStorage.getItem(this.taskNameToDescriptionMapKey);
            this.taskNameToDescriptionMap = obj ? JSON.parse(obj) : {};
        }

        return this.taskNameToDescriptionMap;
    }

    protected saveDescriptionMapPopupAction({ taskName, description }: ITaskDescriptionMapping) {
        this.setDescriptionMap(taskName, description);
        return Promise.resolve(null);
    }

    protected getTrackedProjects(scope: Models.AccountScope) {
        const trackedProjectsMap: { [id: number]: boolean } = {};
        scope.trackedProjects.forEach(tp => trackedProjectsMap[tp] = true);
        return scope.projects.filter(p => trackedProjectsMap[p.projectId]);
    }

    protected openOptionsPagePopupAction() {
        return Promise.resolve(null);
    }

    protected async getRecentTasksAction(accountId: number) {

        let [recentTasks, scope] = await Promise.all([
            this.getRecentTasks(accountId),
            this.getAccountScope(accountId)
        ]);

        let trackedProjectsMap: { [id: number]: boolean } = {};
        scope.trackedProjects.forEach(tp => trackedProjectsMap[tp] = true);

        return recentTasks ? recentTasks.filter(t => !t.details.projectId || trackedProjectsMap[t.details.projectId]).slice(0, 25) : null;
    }
}