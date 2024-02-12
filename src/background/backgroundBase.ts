abstract class BackgroundBase<TConnection extends ServerConnection = ServerConnection> {

    protected readonly _constants: Promise<Models.Constants>;

    /** @virtual */
    protected showError(message: string) {
        // This needed to prevent alert cleaning via build.
        const a = alert;
        a(message);
    }

    /**
     * Show push notification
     * @param message
     * @param title
     */
    protected abstract showNotification(message: string, title?: string): void;

    protected readonly _connection: TConnection;

    protected timer: Models.TimerEx | null = null;

    protected newPopupIssue: WebToolIssueTimer | undefined;

    protected newPopupAccountId: number | undefined;

    protected userProfile: Models.UserProfile | undefined;

    constructor(constants: Promise<Models.Constants>, connection: (constants: Promise<Models.Constants>) => TConnection) {

        this._constants = constants;
        this._connection = connection(constants);

        this.listenPopupAction<IPopupParams, IPopupInitData>('initialize', this.initializePopupAction);
        this.listenPopupAction<void, void>('openTracker', this.openTrackerPagePopupAction);
        this.listenPopupAction<string, void>('openPage', this.openPagePopupAction);
        this.listenPopupAction<void, void>('login', this.loginPopupAction);
        this.listenPopupAction<void, void>('fixTimer', this.fixTimerPopupAction);
        this.listenPopupAction<IPopupTimerData, void>('putTimer', this.putTimerPopupAction);
        this.listenPopupAction<void, void>('hideAllPopups', this.hideAllPopupsPopupAction);
        this.listenPopupAction<IAccountProjectMapping, null>('saveProjectMap', this.saveProjectMapPopupAction);
        this.listenPopupAction<ITaskDescriptionMapping, null>('saveDescriptionMap', this.saveDescriptionMapPopupAction);
        this.listenPopupAction<void, null>('openOptionsPage', this.openOptionsPagePopupAction);
        this.listenPopupAction<number, Models.RecentWorkTask[] | null>('getRecentTasks', this.getRecentTasksAction);

        this.registerMessageListener();
    }

    protected async getProject(projectId: number, accountId?: number) {
        const profile = this.userProfile;
        if (!profile) {
            return;
        }
        accountId = accountId || profile.activeAccountId;

        const scope = await this.getAccountScope(accountId);
        if (scope) {
            return scope.projects.find(_ => _.projectId == projectId);
        }
    }

    protected async openTrackerPage() {
        let url = (await this._constants).serviceUrl;
        if (this.userProfile && this.userProfile.activeAccountId) {
            url += '#/tracker/' + this.userProfile.activeAccountId + '/';
        }
        this.openPage(url);
    }

    /** @virtual */
    protected isLongTimer() {
        return false;
    }

    protected async fixTimer() {
        this.showNotification('You should fix the timer.');
        await this.openTrackerPage();
    }

    protected putTimerWithIntegration(timer: WebToolIssueTimer, status: Models.IntegratedProjectStatus, requiredFields: Models.RequiredFields) {

        let notification: string | undefined;

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
                const statusText = status.projectStatus == Models.ProjectStatus.Archived ? 'archived' : 'done';
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

        let promise = this._connection.setAccountToPost(status.accountId);

        if (!timer.serviceUrl != !status.integrationType || // integration existing or
            !timer.projectName != !status.projectStatus) {  // project existing differ

            // Integration or project does not exist
            promise = promise.then(() => this._connection.postIntegration(<Models.IntegratedProjectIdentifier>{
                serviceUrl: timer.serviceUrl,
                serviceType: timer.serviceType,
                projectName: timer.projectName,
                showIssueId: timer.showIssueId
            }));
        }

        promise = promise
            .then(() => {
                return this._connection.putIssueTimer(timer);
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
                this._connection.setAccountToPost(null);
            });

        return promise;
    }

    protected getIntegrationStatus(timer: WebToolIssueTimer, accountId?: number | undefined) {
        return this._connection.getIntegration(<Models.IntegratedProjectIdentifier>{
            serviceUrl: timer.serviceUrl,
            serviceType: timer.serviceType,
            projectName: timer.projectName,
            showIssueId: !!timer.showIssueId
        }, accountId, !!accountId);
    }

    /** @virtual */
    protected async shouldShowPopup(
        _timer: WebToolIssueTimer,
        _scope: Models.AccountScope,
        _status: Models.IntegratedProjectStatus) {

        return true;
    }

    protected async putExternalTimer(timer: WebToolIssueTimer, accountId?: number, tabId?: number) {

        // Stop timer without any checks (TE-339)
        if (!timer.isStarted) {
            timer = <WebToolIssueTimer>{ isStarted: false }
        } else {
            const trim = (s: string | null | undefined) => s ? s.trim() : s;
            timer.issueName = trim(timer.issueName);
            timer.description = trim(timer.description);
            timer.projectName = trim(timer.projectName);
            if (timer.tagNames) {
                timer.tagNames = timer.tagNames.map(t => trim(t)!);
            }
        }

        this.putData(timer, async timer => {

            let status: Models.IntegratedProjectStatus;
            let scope: Models.AccountScope;
            try {
                status = await this.getIntegrationStatus(timer, accountId);
                scope = await this.getAccountScope(status.accountId);
            } catch (err) {
                this._connection.checkProfileChange(); // TE-179
                return Promise.reject(err);
            }

            if (accountId) {
                return this.putTimerWithIntegration(timer, status, scope.requiredFields);
            }

            if (timer.isStarted) {

                // Set default work type before popup show (TE-299)
                await this.validateTimerTags(timer, status.accountId);

                if (await this.shouldShowPopup(timer, scope, status)) {

                    this.validateTimerProject(timer, status);

                    // This timer will be send when popup ask for initial data
                    this.newPopupIssue = timer;

                    // This account id will be used to prepare initial data for popup
                    this.newPopupAccountId = status.accountId;

                    return this.showPopup(tabId);
                }
            }

            return this.putTimerWithIntegration(timer, status, scope.requiredFields);
        });
    }

    /** @virtual */
    protected putData<T>(data: T, action: (data: T) => Promise<any>) {
        action(data).catch(status => this.showError(this.getErrorText(status)));
    }

    protected getErrorText(status: AjaxStatus) {
        const result = status && (status.responseMessage || status.statusText || status.statusCode);
        if (result) {
            return result.toString();
        }
        return 'Connection to the server failed or was aborted.';
    }

    protected async validateTimerTags(timer: WebToolIssueTimer, accountId?: number) {

        const profile = this.userProfile;
        if (!profile) {
            return;
        }
        accountId = accountId || profile.activeAccountId;

        const scope = await this.getAccountScope(accountId);

        let hasWorkType = false;
        const tagByName: { [name: string]: Models.Tag } = {};
        scope.tags.forEach(tag => {
            tagByName[tag.tagName.toLowerCase()] = tag;
        });

        timer.tagNames = (timer.tagNames || [])
            .map(name => {

                const tag = tagByName[name.toLowerCase()];

                if (!tag) {
                    return name; // new tag
                }

                if (tag.isWorkType) {
                    if (hasWorkType) {
                        return ''; // accept only first work type
                    }
                    hasWorkType = true;
                }

                return tag.tagName; // old tag (character case can be different)
            })
            .filter(name => !!name);

        if (!hasWorkType) {
            const defaultWorkType = await this.getDefaultWorkType(accountId);
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

        const profile = this.userProfile;
        if (!profile) {
            return;
        }

        accountId = accountId || profile.activeAccountId;

        const scope = await this.getAccountScope(accountId);
        const member = profile.accountMembership.find(_ => _.account.accountId == accountId);
        if (!member) {
            return;
        }
        return scope.tags.find(tag => tag.tagId == member.defaultWorkTypeId);
    }

    protected async getRecentTasks(accountId?: number) {
        const profile = this.userProfile;
        if (!profile) {
            return;
        }
        return await this._connection.getRecentWorkTasks(accountId || profile.activeAccountId);
    }

    // account scope cache

    private _accountScopeCache: { [key: number]: Promise<Models.AccountScope> } = {};

    protected invalidateAccountScopeCache(accountId: number) {
        delete this._accountScopeCache[accountId];
    }

    protected getAccountScope(accountId: number) {
        let scope = this._accountScopeCache[accountId];
        if (!scope) {
            scope = this._accountScopeCache[accountId] = this._connection.getAccountScope(accountId)

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

    protected listenPopupAction<TParams, TResult>(action: string, handler: (data: TParams) => Promise<TResult>) {
        this._popupActions[action] = handler;
    }

    protected onPopupRequest(request: IPopupRequest, callback: (response: IPopupResponse) => void) {
        const action = request.action;
        const handler = this._popupActions[action];
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

    protected abstract showPopup(tabId?: number): void

    protected abstract hidePopup(tabId?: number): void

    /** @virtual */
    protected async initializePopupAction(params: IPopupParams) {
        return await this.getPopupData(params);
    }

    protected openTrackerPagePopupAction() {
        return this.openTrackerPage()
    }

    protected openPagePopupAction(url) {
        return Promise.resolve(null).then(() => {
            this.openPage(url);
        });
    }

    /** @virtual */
    protected reconnect(_showLoginDialog: boolean) {
        this._connection.reconnect();
    }

    protected loginPopupAction() {
        return Promise.resolve(null).then(() => {
            this.reconnect(true);
        });
    }

    protected fixTimerPopupAction() {
        return this.openTrackerPage();
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

    protected abstract getActiveTabTitle(): Promise<string | null>;

    protected abstract getActiveTabPossibleWebTool(): Promise<WebToolInfo | undefined>;

    /** @virtual */
    protected openPage(url: string) {
        open(url);
    }

    protected abstract registerMessageListener(): void

    protected saveProjectMapPopupAction({ accountId, projectName, projectId }: IAccountProjectMapping) {
        this.setProjectMap(accountId, projectName, projectId);
        return Promise.resolve(null as null);
    }

    protected async saveDescriptionMapPopupAction({ taskName, description }: ITaskDescriptionMapping) {
        await this.setDescriptionMap(taskName, description);
        return Promise.resolve(null as null);
    }

    protected getTrackedProjects(scope: Models.AccountScope) {
        const trackedProjectsMap: { [id: number]: boolean } = {};
        scope.trackedProjects.forEach(tp => trackedProjectsMap[tp] = true);
        return scope.projects.filter(p => trackedProjectsMap[p.projectId]);
    }

    /** @virtual */
    protected openOptionsPagePopupAction() {
        return Promise.resolve(null as null);
    }

    protected async getRecentTasksAction(accountId: number) {

        const [recentTasks, scope] = await Promise.all([
            this.getRecentTasks(accountId),
            this.getAccountScope(accountId)
        ]);

        const trackedProjectsMap: { [id: number]: boolean } = {};
        scope.trackedProjects.forEach(tp => trackedProjectsMap[tp] = true);

        return recentTasks ? recentTasks.filter(t => !t.details.projectId || trackedProjectsMap[t.details.projectId]).slice(0, 25) : null;
    }

    protected async getPopupData(params: IPopupParams) {

        let accountId = params.accountId;
        const profile = this.userProfile;
        if (!profile || !this.timer) {
            throw 'Not connected';
        }

        // get popup default data from account where project exist
        if (!accountId) {
            accountId = this.newPopupAccountId || profile.activeAccountId;
        }

        // get default data from active account
        if (!profile.accountMembership.some(_ => _.account.accountId == accountId)) {
            accountId = profile.activeAccountId;
        }

        const [title, webTool, scope, defaultWorkType] = await Promise.all([
            this.getActiveTabTitle(),
            this.getActiveTabPossibleWebTool(),
            this.getAccountScope(accountId),
            this.getDefaultWorkType(accountId),
        ]);

        const userRole = profile.accountMembership
            .find(_ => _.account.accountId == accountId)
            ?.role || Models.ServiceRole.Member;

        const canMembersManagePublicProjects = scope.account.canMembersManagePublicProjects;
        const canCreateTags = scope.account.canMembersCreateTags;
        const isAdmin = (userRole == Models.ServiceRole.Admin || userRole == Models.ServiceRole.Owner);

        const newIssue: WebToolIssueTimer = this.newPopupIssue || { // _newPopupIssue is null if called from toolbar popup
            isStarted: true,
            description: title,
            tagNames: defaultWorkType ? [defaultWorkType.tagName] : []
        } as WebToolIssueTimer;

        const filteredProjects = this.getTrackedProjects(scope)
            .sort((a, b) => a.projectName.localeCompare(b.projectName, [], { sensitivity: 'base' }));

        const projectMap = await this.getProjectMap(accountId);

        // Determine default project
        let defaultProjectId: number | null = null;
        if (projectMap) {

            const projectName = newIssue.projectName || '';

            defaultProjectId = projectMap[projectName];

            // Remove mapped project from localstorage if project was deleted/closed
            if (defaultProjectId && filteredProjects.every(_ => _.projectId != defaultProjectId)) {
                this.setProjectMap(accountId, projectName, null);
                defaultProjectId = null;
            }
        }

        const descriptionMap = await this.getDescriptionMap();

        if (newIssue.issueId && !newIssue.description && descriptionMap) {
            newIssue.description = newIssue.issueName && descriptionMap[newIssue.issueName];
        }

        this.newPopupIssue = undefined;
        this.newPopupAccountId = undefined;

        return <IPopupInitData>{
            timer: this.timer,
            newIssue,
            profile: this.userProfile,
            accountId,
            projects: filteredProjects,
            clients: scope.clients,
            tags: scope.tags,
            canCreateProjects: isAdmin || canMembersManagePublicProjects,
            canCreateTags,
            constants: await this._constants,
            defaultProjectId,
            requiredFields: scope.requiredFields,
            possibleWebTool: webTool
        };
    }

    // account to project map

    private accountToProjectMap: {
        [accountId: number]: {
            [key: string]: number;
        };
    } | undefined;

    private accountToProjectMapKey = 'accountToProjectMap';

    private async setProjectMap(accountId: number, projectName: string, projectId: number | null) {

        let map = await this.getProjectMap(accountId);
        if (projectId) {
            map = map || {};
            map[projectName] = projectId;
            this.accountToProjectMap ||= {};
            this.accountToProjectMap[accountId] = map;
        } else if (map) {
            delete map[projectName];
        }

        await storage.setItem(this.accountToProjectMapKey, JSON.stringify(this.accountToProjectMap));
    }

    private async getProjectMap(accountId: number) {

        if (!this.accountToProjectMap) {
            const json = await storage.getItem(this.accountToProjectMapKey);
            this.accountToProjectMap = json ? JSON.parse(json) : {};
        }

        return this.accountToProjectMap![accountId];
    }

    // task name to description map
    private taskNameToDescriptionMap: {
        [key: string]: string;
    } | undefined;

    private taskNameToDescriptionMapKey = 'taskNameToDescriptionMap';

    private async setDescriptionMap(taskName: string, description: string) {
        if (!taskName) {
            // There should be no empty values here when the API and client is working properly,
            // just in case it's better to ignore it here so that the user doesn't get strange behavior
            return;
        }
        let map = await this.getDescriptionMap();
        if (description && description != taskName) {
            map = map || {};
            map[taskName] = description;
            this.taskNameToDescriptionMap = map;
        } else if (map) {
            delete map[taskName];
        }

        await storage.setItem(this.taskNameToDescriptionMapKey, JSON.stringify(this.taskNameToDescriptionMap));
    }

    private async getDescriptionMap() {
        if (!this.taskNameToDescriptionMap) {
            const json = await storage.getItem(this.taskNameToDescriptionMapKey);
            this.taskNameToDescriptionMap = json ? JSON.parse(json) : {};
        }

        return this.taskNameToDescriptionMap;
    }
}