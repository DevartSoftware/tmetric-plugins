const enum ButtonState { start, stop, fixtimer, connect }

class ExtensionBase {

    private getDefaultConstants() {
        let constants: Models.Constants = {
            maxTimerHours: 12,
            extensionName: chrome.runtime.getManifest().name,
            browserSchema: this.getBrowserSchema(),
            extensionUUID: this.getExtensionUUID(),
            serviceUrl: this.serviceUrl
        };
        return constants;
    }

    private getDefaultLoginPosition() {
        return {
            width: 420,
            height: 535,
            left: 400,
            top: 300
        }
    }

    /**
     * @abstract
     */
    protected getBrowserSchema(): string {
        throw new Error('Not implemented');
    }

    /**
     * @abstract
     */
    protected getExtensionUUID(): string {
        throw new Error('Not implemented');
    }

    /**
     * Create popup window
     * @param width
     * @param height
     * @param left
     * @param top
     */
    private createLoginDialog(width: number, height: number, left: number, top: number) {

        chrome.windows.create(<chrome.windows.CreateData>{
            left,
            top,
            width,
            height,
            url: this.getLoginUrl(),
            type: 'popup'
        }, popupWindow => {

            let popupTab = popupWindow.tabs[0];

            this.loginWinId = popupWindow.id;
            this.loginTabId = popupTab.id;
            this.loginWindowPending = false;

            let updateInfo = <chrome.windows.UpdateInfo>{ focused: true };

            if (popupTab.width) {
                let deltaWidth = width - popupTab.width;
                updateInfo.left = left - Math.round(deltaWidth / 2);
                updateInfo.width = width + deltaWidth;
            }

            if (popupTab.height) {
                let deltaHeight = height - popupTab.height;
                updateInfo.top = top - Math.round(deltaHeight / 2);
                updateInfo.height = height + deltaHeight;
            }

            chrome.windows.update(popupWindow.id, updateInfo);
        });
    }

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
    protected showNotification(message: string, title?: string) {
        if (this.lastNotificationId) {
            chrome.notifications.clear(this.lastNotificationId, () => { });
        }
        title = title || 'TMetric';
        let type = 'basic';
        let iconUrl = 'images/icon80.png';
        chrome.notifications.create(
            null,
            { title, message, type, iconUrl },
            id => this.lastNotificationId = id);
    }

    private buttonState = ButtonState.start;

    private loginTabId: number;

    private loginWinId: number;

    private loginWindowPending: boolean;

    private lastNotificationId: string;

    private connection = new SignalRConnection();

    private serviceUrl: string;

    private signalRUrl: string;

    private extraHours: number;

    private _constants: Models.Constants;

    private _actionOnConnect: () => void;

    private _timer: Models.TimerEx;

    private _newPopupIssue: WebToolIssueTimer;

    private _newPopupAccountId: number;

    private _timeEntries: Models.TimeEntry[];

    private _userProfile: Models.UserProfile;

    private defaultApplicationUrl = 'https://app.tmetric.com/';

    private defaultSignalRUrl = 'https://signalr.tmetric.com/';

    constructor() {

        this.updateState();

        this.serviceUrl = this.normalizeUrlLastSlash(this.getTestValue('tmetric.url') || this.defaultApplicationUrl);
        this.signalRUrl = this.normalizeUrlLastSlash(this.getTestValue('tmetric.signalRUrl') || this.defaultSignalRUrl);

        this._constants = this.getDefaultConstants();

        this.extraHours = this.getTestValue('tmetric.extraHours');
        if (this.extraHours) {
            this.extraHours = parseFloat(<any>this.extraHours);
        }
        else {
            this.extraHours = 0;
        }

        this.connection.onUpdateTimer(async timer => {

            // looks like disconnect
            if (timer == null) {
                this.clearIssuesDurationsCache();
            }

            this._timer = timer;

            if (timer && timer.details) {
                let project = await this.getProject(timer.details.projectId);
                timer.projectName = project && project.projectName;
            }

            this.updateState();
            this.sendToTabs({ action: 'setTimer', data: timer });

            // timer should be received from server on connect
            if (timer) {
                let action = this._actionOnConnect;
                if (action) {
                    this._actionOnConnect = null;
                    action();
                }
            }
        });

        this.connection.onUpdateTracker(timeEntries => {
            this._timeEntries = timeEntries;
            this.updateState();
        });

        this.connection.onUpdateProfile(profile => {
            this._userProfile = profile;
        });

        this.connection.onUpdateActiveAccount(acountId => {
            this.clearIssuesDurationsCache();
        });

        this.connection.onInvalidateAccountScopeCache(accountId => {
            this.invalidateAccountScopeCache(accountId);
        });

        this.connection.onRemoveExternalIssuesDurations(identifiers => {
            this.removeIssuesDurationsFromCache(identifiers);
        });

        this.connection
            .init(this.serviceUrl, this.signalRUrl)
            .then(() => this.connection.getVersion());

        this.listenPopupAction<IPopupParams, IPopupInitData>('initialize', this.initializePopupAction);
        this.listenPopupAction<void, void>('openTracker', this.openTrackerPagePopupAction);
        this.listenPopupAction<string, void>('openPage', this.openPagePopupAction);
        this.listenPopupAction<void, boolean>('isConnectionRetryEnabled', this.isConnectionRetryEnabledPopupAction);
        this.listenPopupAction<void, void>('retry', this.retryConnectionPopupAction);
        this.listenPopupAction<void, void>('login', this.loginPopupAction);
        this.listenPopupAction<void, void>('fixTimer', this.fixTimerPopupAction);
        this.listenPopupAction<IPopupTimerData, void>('putTimer', data => {
            this.putExternalTimer(data.timer, null, data.accountId);
            return Promise.resolve();
        });
        this.listenPopupAction<void, void>('hideAllPopups', () => {
            this.sendToTabs({ action: 'hidePopup' });
            return Promise.resolve(null);
        });
        this.listenPopupAction<{ projectName: string, projectId: number }, void>('saveProjectMap', ({ projectName, projectId }) => {
            this.setProjectMap(this._userProfile.activeAccountId, projectName, projectId);
            return Promise.resolve(null);
        });
        this.listenPopupAction<{ taskName: string, description: string }, void>('saveDescriptionMap', ({ taskName, description }) => {
            this.setDescriptionMap(taskName, description);
            return Promise.resolve(null);
        });
        this.listenPopupAction<void, void>('openOptionsPage', () => {
            chrome.runtime.openOptionsPage();
            return Promise.resolve(null);
        });
        this.listenPopupAction<number, Models.RecentWorkTask[]>('getRecentTasks', this.getRecentTasksAction);

        this.registerTabsUpdateListener();
        this.registerTabsRemoveListener();
        this.registerMessageListener();

        // Update hint once per minute
        let setUpdateTimeout = () => setTimeout(() => {
            this.updateState();
            setUpdateTimeout();
        }, (60 - new Date().getSeconds()) * 1000);

        setUpdateTimeout();
    }

    /** Handles messages from in-page scripts */
    private onTabMessage(message: ITabMessage, tabId: number) {

        this.sendToTabs({ action: message.action + '_callback' }, tabId);

        switch (message.action) {

            case 'getConstants':
                this.sendToTabs({ action: 'setConstants', data: this._constants }, tabId);
                break;

            case 'getTimer':
                this.sendToTabs({ action: 'setTimer', data: this._timer }, tabId);
                break;

            case 'putTimer':
                this.putExternalTimer(message.data, tabId);
                break;

            case 'getIssuesDurations':
                this.getIssuesDurations(message.data).then(durations => {

                    // show extra time on link for test purposes
                    if (this.extraHours && this._timer && this._timer.isStarted) {
                        let activeDetails = this._timer.details;
                        if (activeDetails && activeDetails.projectTask) {
                            let activeTask = activeDetails.projectTask;
                            for (let i = 0; i < durations.length; i++) {
                                let duration = durations[i];
                                if (duration.issueUrl == activeTask.relativeIssueUrl && duration.serviceUrl == activeTask.integrationUrl) {
                                    duration = JSON.parse(JSON.stringify(duration));
                                    duration.duration += this.extraHours * 3600000;
                                    durations[i] = duration;
                                    break;
                                }
                            }
                        }
                    }

                    this.sendToTabs({ action: 'setIssuesDurations', data: durations }, tabId);
                });
                break;
        }
    }

    private getSettings() {
        return new Promise<IExtensionSettings>((resolve, reject) => {
            chrome.storage.sync.get(
                <IExtensionSettings>{ showPopup: Models.ShowPopupOption.Always },
                resolve);
        });
    }

    private async getProject(projectId: number, accountId?: number) {
        accountId = accountId || this._userProfile.activeAccountId;

        let scope = await this.getAccountScope(accountId);
        if (scope) {
            return scope.projects.find(_ => _.projectId == projectId);
        }
    }

    private openTrackerPage() {
        let url = this.serviceUrl;
        if (this._userProfile && this._userProfile.activeAccountId) {
            url += '#/tracker/' + this._userProfile.activeAccountId + '/';
        }
        this.openPage(url);
    }

    private fixTimer() {
        this.showNotification('You should fix the timer.');
        this.openTrackerPage();
    }

    private putTimerWithIntegration(timer: WebToolIssueTimer, status: Models.IntegratedProjectStatus) {

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

    private getIntegrationStatus(timer: WebToolIssueTimer, accountId?: number) {
        return this.connection.getIntegration(<Models.IntegratedProjectIdentifier>{
            serviceUrl: timer.serviceUrl,
            serviceType: timer.serviceType,
            projectName: timer.projectName,
            showIssueId: !!timer.showIssueId
        }, accountId, !!accountId);
    }

    private async putExternalTimer(timer: WebToolIssueTimer, tabId: number, accountIdToPut: number = null) {

        let settings = await this.getSettings();

        // Stop timer without any checks (TE-339)
        if (!timer.isStarted) {
            timer = <WebToolIssueTimer>{ isStarted: false }
        }

        this.putData(timer, timer => {

            let status: Models.IntegratedProjectStatus;
            let scopePromise = this.getIntegrationStatus(timer, accountIdToPut).then(s => {
                status = s;
                return this.getAccountScope(status.accountId);
            });

            scopePromise.catch(() => {
                this.connection.checkProfileChange(); // TE-179
            });

            return scopePromise.then(scope => {

                if (accountIdToPut) {
                    return this.putTimerWithIntegration(timer, status);
                }

                if (timer.isStarted) {

                    const matchedProjectCount = this.getTrackedProjects(scope).filter(p => p.projectName == timer.projectName).length;
                    const requiredFields = scope.requiredFields;
                    let showPopup = settings.showPopup || Models.ShowPopupOption.Always;

                    if (requiredFields.taskLink && !timer.issueUrl) {
                        showPopup = Models.ShowPopupOption.Never;
                    } else if (
                        requiredFields.description && !timer.description ||
                        requiredFields.project && !matchedProjectCount ||
                        requiredFields.tags && (!timer.tagNames || !timer.tagNames.length)
                    ) {
                        showPopup = Models.ShowPopupOption.Always;
                    }

                    if (showPopup != Models.ShowPopupOption.Never) {

                        if (showPopup == Models.ShowPopupOption.Always ||
                            !timer.projectName ||
                            status.projectStatus == null ||
                            matchedProjectCount > 1
                        ) {

                            // This timer will be send when popup ask for initial data
                            this._newPopupIssue = timer;
                            // This account id will be used to prepare initial data for popup
                            this._newPopupAccountId = status.accountId;

                            return this.connection.connect() // Set default work type before popup show (TE-299)
                                .then(() => this.validateTimerTags(timer, status.accountId))
                                .then(() => {
                                    this.sendToTabs({ action: 'showPopup' }, tabId);
                                });
                        }
                    }
                }

                return this.validateTimerTags(timer, status.accountId)
                    .then(() => this.putTimerWithIntegration(timer, status));
            });
        });
    }

    private putData<T>(data: T, action: (data: T) => Promise<any>, retryAction?: (data: T) => Promise<any>) {

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

            if (this.buttonState == ButtonState.fixtimer) {

                // ensure connection before page open to prevent login duplication (#67759)
                this._actionOnConnect = () => this.fixTimer();
                this.connection.getTimer().catch(status => onFail(status, showDialog));
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

    private updateState() {
        let state = ButtonState.connect;
        let text = 'Not Connected';
        if (this._timer) {
            let todayTotal = 'Today Total - '
                + this.durationToString(this.getDuration(this._timeEntries))
                + ' hours';
            if (this._timer.isStarted) {
                if (this.getDuration(this._timer) > this._constants.maxTimerHours * 60 * 60000) {
                    state = ButtonState.fixtimer;
                    text = 'Started\nYou need to fix long-running timer';
                }
                else {
                    state = ButtonState.stop;
                    let description = this._timer.details.description || '(No task description)';
                    text = `Started (${todayTotal})\n${description}`;
                }
            }
            else {
                state = ButtonState.start;
                text = 'Paused\n' + todayTotal;
            }
        }
        this.buttonState = state;
        this.setButtonIcon(state == ButtonState.stop || state == ButtonState.fixtimer ? 'active' : 'inactive', text);
    }

    private getLoginUrl(): string {
        return this.serviceUrl + 'login';
    }

    private normalizeUrlLastSlash(url: string) {
        if (url[url.length - 1] != '/') {
            url += '/';
        }
        return url;
    }

    private normalizeUrl(url: string) {
        if (url) {
            let i = url.indexOf('#');
            if (i > 0) {
                url = url.substring(0, i);
            }
        }
        return url;
    }

    private getTabIssue(url: string, title: string): WebToolIssue {
        return { issueName: title || this.normalizeUrl(url) };
    }

    private getDuration(timer: Models.Timer): number
    private getDuration(timeEntries: Models.TimeEntry[]): number
    private getDuration(arg: any): any {
        if (arg) {
            let now = new Date().getTime();
            if ((<Models.TimeEntry[]>arg).reduce) {
                return (<Models.TimeEntry[]>arg).reduce((duration, entry) => {
                    let startTime = Date.parse(entry.startTime);
                    let endTime = entry.endTime ? Date.parse(entry.endTime) : now;
                    return duration + (endTime - startTime);
                }, 0);
            }
            else if ((<Models.Timer>arg).isStarted) {
                return now - Date.parse((<Models.Timer>arg).startTime);
            }
        }
        return 0;
    }

    private durationToString(duration: number) {

        let sign = '';
        if (duration < 0) {
            duration = -duration;
            sign = '-';
        }

        let totalMinutes = Math.floor(duration / 60000);
        let hours = Math.floor(totalMinutes / 60);
        let minutes = totalMinutes % 60;

        return sign + hours + (minutes < 10 ? ':0' : ':') + minutes;
    }

    private getErrorText(status: AjaxStatus) {
        let result = status && (status.responseMessage || status.statusText || status.statusCode);
        if (result) {
            return result.toString();
        }
        return 'Connection to the server failed or was aborted.';
    }

    private async validateTimerTags(timer: WebToolIssueTimer, accountId?: number) {

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

    private async getDefaultWorkType(accountId?: number) {

        accountId = accountId || this._userProfile.activeAccountId;

        let scope = await this.getAccountScope(accountId);
        let member = this._userProfile.accountMembership.find(_ => _.account.accountId == accountId);

        return scope.tags.find(tag => tag.tagId == member.defaultWorkTypeId);
    }

    private async getRecentTasks(accountId?: number) {
        return await this.connection.getRecentWorkTasks(accountId || this._userProfile.activeAccountId);
    }

    // issues durations cache

    private _issuesDurationsCache: { [key: string]: WebToolIssueDuration } = {};

    private makeIssueDurationKey(identifier: WebToolIssueIdentifier) {
        return identifier.serviceUrl + '/' + identifier.issueUrl;
    }

    private getIssueDurationFromCache(identifier: WebToolIssueIdentifier): WebToolIssueDuration {
        return this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
    }

    private putIssuesDurationsToCache(durations: WebToolIssueDuration[]) {
        durations.forEach(duration => {
            this._issuesDurationsCache[this.makeIssueDurationKey(duration)] = duration;
        });
    }

    private removeIssuesDurationsFromCache(identifiers: WebToolIssueIdentifier[]) {
        identifiers.forEach(identifier => {
            delete this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
        });
    }

    private clearIssuesDurationsCache() {
        this._issuesDurationsCache = {};
    }

    private getIssuesDurations(identifiers: WebToolIssueIdentifier[]): Promise<WebToolIssueDuration[]> {

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

    private invalidateAccountScopeCache(accountId: number) {
        delete this._accountScopeCache[accountId];
    }

    private getAccountScope(accountId: number) {
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

    private onPopupRequest(request: IPopupRequest, callback: (response: IPopupResponse) => void) {
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
                issueName: title,
                description: title,
                tagNames: defaultWorkType ? [defaultWorkType.tagName] : []
            };

            let filteredProjects = this.getTrackedProjects(scope)
                .sort((a, b) => a.projectName.localeCompare(b.projectName, [], { sensitivity: 'base' }));

            const projectMap = this.getProjectMap(accountId);

            // Determine default project
            let defaultProjectId = <number>null;
            if (projectMap) {
                defaultProjectId = projectMap[newIssue.projectName || ''];

                // Remove mapped project from localstorage if project was deleted/closed
                if (defaultProjectId && filteredProjects.every(_ => _.projectId != defaultProjectId)) {
                    this.setProjectMap(accountId, newIssue.projectName, null);
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

    private initializePopupAction(params: IPopupParams): Promise<IPopupInitData> {
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

    private openTrackerPagePopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }

    private openPagePopupAction(url) {
        return Promise.resolve(null).then(() => {
            this.openPage(url);
        });
    }

    private isConnectionRetryEnabledPopupAction(): Promise<boolean> {
        return this.connection.isConnectionRetryEnabled();
    }

    private retryConnectionPopupAction() {
        return this.connection.retryConnection();
    }

    private showLoginDialog() {
        if (this.loginWinId) {
            chrome.windows.update(this.loginWinId, { focused: true });
            return;
        }

        chrome.windows.getLastFocused(pageWindow => {
            if (this.loginWindowPending) {
                return;
            }
            this.loginWindowPending = true;
            try {

                let { width, height, left, top } = this.getDefaultLoginPosition();

                if (pageWindow.left != null && pageWindow.width != null) {
                    left = Math.round(pageWindow.left + (pageWindow.width - width) / 2);
                }
                if (pageWindow.top != null && pageWindow.height != null) {
                    top = Math.round(pageWindow.top + (pageWindow.height - height) / 2);
                }

                this.createLoginDialog(width, height, left, top);
            }
            catch (e) {
                this.loginWindowPending = false;
            }
        });
    }

    private loginPopupAction() {
        return Promise.resolve(null).then(() => {
            this.connection.reconnect().catch(() => this.showLoginDialog());
        });
    }

    private fixTimerPopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }

    private putTimerPopupAction(timer: Models.Timer) {
        return Promise.resolve(null).then(() =>
            this.putData(timer, timer => this.connection.putTimer(timer)));
    }

    private setButtonIcon(icon: string, tooltip: string) {
        chrome.browserAction.setIcon({
            path: {
                '19': 'images/' + icon + '19.png',
                '38': 'images/' + icon + '38.png'
            }
        });
        chrome.browserAction.setTitle({ title: tooltip });
    }

    protected sendToTabs(message: ITabMessage, tabId?: number) {

        if (tabId != null) {
            chrome.tabs.sendMessage(tabId, message);
            return;
        }

        chrome.tabs.query({}, tabs => tabs && tabs.forEach(tab => {
            if (tab.url && tab.url.startsWith('http')) {
                chrome.tabs.sendMessage(tab.id, message, response => {

                    // Ignore errors in broadcast messages
                    let error = chrome.runtime.lastError;
                    if (error) {
                        console.log(`${message.action}: ${error}`)
                    }
                });
            }
        }));
    }

    private getTestValue(name: string): any {
        return localStorage.getItem(name);
    }

    private getActiveTabTitle() {
        return new Promise<string>((resolve, reject) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    let activeTab = tabs && tabs[0];
                    let title = activeTab && activeTab.title;
                    resolve(title);
                });
        });
    }

    protected getActiveTabId() {
        return new Promise<number>((resolve, reject) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    let activeTab = tabs && tabs[0];
                    let id = activeTab && activeTab.id;
                    resolve(id);
                });
        });
    }

    private openPage(url: string) {

        chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }, tabs => {

            let currentWindowId = tabs && tabs.length && tabs[0].windowId;

            // chrome.tabs.query do not support tab search with hashed urls
            // https://developer.chrome.com/extensions/match_patterns
            chrome.tabs.query({ url: url.split('#')[0] + '*' }, tabs => {
                // filter tabs queried without hashes by actual url
                let pageTabs = tabs && tabs.filter(tab => tab.url == url);
                if (pageTabs && pageTabs.length) {

                    let anyWindowTab: chrome.tabs.Tab, anyWindowActiveTab: chrome.tabs.Tab, currentWindowTab: chrome.tabs.Tab, currentWindowActiveTab: chrome.tabs.Tab;
                    for (let index = 0, size = pageTabs.length; index < size; index += 1) {
                        anyWindowTab = pageTabs[index];
                        if (anyWindowTab.active) {
                            anyWindowActiveTab = anyWindowTab;
                        }
                        if (anyWindowTab.windowId == currentWindowId) {
                            currentWindowTab = anyWindowTab;
                            if (currentWindowTab.active) {
                                currentWindowActiveTab = currentWindowTab;
                            }
                        }
                    }

                    let tabToActivate = currentWindowActiveTab || currentWindowTab || anyWindowActiveTab || anyWindowTab;
                    chrome.windows.update(tabToActivate.windowId, { focused: true });
                    chrome.tabs.update(tabToActivate.id, { active: true });
                } else {
                    chrome.tabs.create({ active: true, windowId: currentWindowId, url });
                }
            });
        });
    }

    private registerTabsUpdateListener() {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (tabId == this.loginTabId && changeInfo.url) {
                let tabUrl = changeInfo.url.toLowerCase();
                let serviceUrl = this.serviceUrl.toLowerCase();
                if (tabUrl == serviceUrl || tabUrl.indexOf(serviceUrl + '#') == 0) {
                    chrome.tabs.remove(tabId);
                    return;
                }
            }
        });
    }

    private registerTabsRemoveListener() {
        chrome.tabs.onRemoved.addListener((tabId) => {
            if (tabId == this.loginTabId) {
                this.loginTabId = null;
                this.loginWinId = null;
                this.connection.reconnect();
            }
        });
    }

    private registerMessageListener() {
        chrome.runtime.onMessage.addListener((
            message: ITabMessage | IPopupRequest | IExtensionSettingsMessage,
            sender: chrome.runtime.MessageSender, senderResponse: (IPopupResponse) => void) => {

            // Popup requests
            if (!sender.url || sender.url.startsWith(this._constants.browserSchema)) {
                this.onPopupRequest(message, senderResponse);
                return !!senderResponse;
            }

            if (!sender.tab) {
                return;
            }

            // Ignore login dialog
            if (sender.tab.id == this.loginTabId) {
                return;
            }

            // Tab page requests
            let tabId = sender.tab.id;
            this.onTabMessage(message, tabId);

            senderResponse(null);
        });
    }

    accountToProjectMap: {
        [accountId: number]: {
            [key: string]: number
        }
    };

    accountToProjectMapKey = 'accountToProjectMap';

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

    taskNameToDescriptionMap: {
        [key: string]: string
    };

    taskNameToDescriptionMapKey = 'taskNameToDescriptionMap';

    setDescriptionMap(taskName: string, description: string) {
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

    getDescriptionMap() {
        if (!this.taskNameToDescriptionMap) {
            const obj = localStorage.getItem(this.taskNameToDescriptionMapKey);
            this.taskNameToDescriptionMap = obj ? JSON.parse(obj) : {};
        }

        return this.taskNameToDescriptionMap;
    }

    private getTrackedProjects(scope: Models.AccountScope) {
        const trackedProjectsMap: { [id: number]: boolean } = {};
        scope.trackedProjects.forEach(tp => trackedProjectsMap[tp] = true);
        return scope.projects.filter(p => trackedProjectsMap[p.projectId]);
    }

    private async getRecentTasksAction(accountId: number) {

        let [recentTasks, scope] = await Promise.all([
            this.getRecentTasks(accountId),
            this.getAccountScope(accountId)
        ]);

        let trackedProjectsMap: { [id: number]: boolean } = {};
        scope.trackedProjects.forEach(tp => trackedProjectsMap[tp] = true);

        return recentTasks ? recentTasks.filter(t => !t.details.projectId || trackedProjectsMap[t.details.projectId]).slice(0, 25) : null;
    }
}