const enum ButtonState { start, stop, fixtimer, connect }

class ExtensionBase {

    getDefaultConstants() {
        let constants: Models.Constants = {
            maxTimerHours: 12,
            extensionName: chrome.runtime.getManifest().description
        };
        return constants;
    }

    getDefaultLoginPosition() {
        return {
            width: 420,
            height: 535,
            left: 400,
            top: 300
        }
    }

    /**
     * Create popup window
     * @abstract
     * @param width
     * @param height
     * @param left
     * @param top
     */
    createPopupWindow(width: number, height: number, left: number, top: number) { }

    showError(message: string) {
        // This needed to prevent alert cleaning via build.
        var a = alert;
        a(message);
    }

    /**
     * Check popup request
     * @abstract
     * @param sender
     */
    isPopupRequest(sender: chrome.runtime.MessageSender): boolean {
        return false;
    }

    /**
     * Show push notification
     * @param message
     * @param title
     */
    showNotification(message: string, title?: string) {
        if (this.lastNotificationId) {
            chrome.notifications.clear(this.lastNotificationId, () => { });
        }
        title = title || 'TMetric';
        var type = 'basic';
        var iconUrl = 'images/icon80.png';
        chrome.notifications.create(
            null,
            { title, message, type, iconUrl },
            id => this.lastNotificationId = id);
    }

    buttonState = ButtonState.start;

    loginTabId: number;

    loginWinId: number;

    loginWindowPending: boolean;

    lastNotificationId: string;

    connection = new SignalRConnection();

    protected serviceUrl: string;

    protected extraHours: number;

    private _constants: Models.Constants;

    private _actionOnConnect: () => void;

    private _timer: Models.Timer;

    private _timeEntries: Models.TimeEntry[];

    private _userProfile: Models.UserProfile;

    private _projects: Models.Project[];

    private _tags: Models.Tag[];

    private defaultApplicationUrl = 'https://app.tmetric.com/';

    constructor() {

        this._constants = this.getDefaultConstants();

        this.serviceUrl = this.getTestValue('tmetric.url') || this.defaultApplicationUrl;
        if (this.serviceUrl[this.serviceUrl.length - 1] != '/') {
            this.serviceUrl += '/';
        }

        this.extraHours = this.getTestValue('tmetric.extraHours');
        if (this.extraHours) {
            this.extraHours = parseFloat(<any>this.extraHours);
        }
        else {
            this.extraHours = 0;
        }

        this.connection.onUpdateTimer(timer => {

            // looks like disconnect
            if (timer == null) {
                this.clearIssuesDurationsCache();
            }

            this._timer = timer;
            this.updateState();
            this.sendToTabs({ action: 'setTimer', data: timer });

            // timer should be received from server on connect
            if (timer) {
                var action = this._actionOnConnect;
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

        this.connection.onUpdateProjects(projects => {
            this._projects = projects;
        });

        this.connection.onUpdateTags(tags => {
            this._tags = tags;
        });

        this.connection.onUpdateActiveAccount(acountId => {
            this.clearIssuesDurationsCache();
        });

        this.connection.onRemoveExternalIssuesDurations(identifiers => {
            this.removeIssuesDurationsFromCache(identifiers);
        });

        this.connection
            .init(this.serviceUrl)
            .then(() => this.connection.getVersion());

        this.listenPopupAction<void, IPopupInitData>('initialize', this.initializePopupAction);
        this.listenPopupAction<void, void>('openTracker', this.openTrackerPagePopupAction);
        this.listenPopupAction<string, void>('openPage', this.openPagePopupAction);
        this.listenPopupAction<void, boolean>('isConnectionRetryEnabled', this.isConnectionRetryEnabledPopupAction);
        this.listenPopupAction<void, void>('retry', this.retryConnectionPopupAction);
        this.listenPopupAction<void, void>('login', this.loginPopupAction);
        this.listenPopupAction<void, void>('fixTimer', this.fixTimerPopupAction);
        this.listenPopupAction<Models.Timer, void>('putTimer', this.putTimerPopupAction);

        this.registerTabsUpdateListener();
        this.registerTabsRemoveListener();
        this.registerMessageListener();

        // Update hint once per minute
        var setUpdateTimeout = () => setTimeout(() => {
            this.updateState();
            setUpdateTimeout();
        }, (60 - new Date().getSeconds()) * 1000);

        setUpdateTimeout();
    }

    /** Handles messages from in-page scripts */
    onTabMessage(message: ITabMessage, tabId: any) {

        this.sendToTabs({ action: message.action + '_callback' }, tabId);

        switch (message.action) {

            case 'getConstants':
                this.sendToTabs({ action: 'setConstants', data: this._constants }, tabId);
                break;

            case 'getTimer':
                this.sendToTabs({ action: 'setTimer', data: this._timer }, tabId);
                break;

            case 'putTimer':
                this.putTabTimer(message.data);
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

    openTrackerPage() {
        var url = this.serviceUrl;
        if (this._userProfile && this._userProfile.activeAccountId) {
            url += '#/tracker/' + this._userProfile.activeAccountId + '/';
        }
        this.openPage(url);
    }

    fixTimer() {
        this.showNotification('You should fix the timer.');
        this.openTrackerPage();
    }

    putTabTimer(url: string, title: string)
    putTabTimer(timer: Integrations.WebToolIssueTimer)
    putTabTimer(param1: any, param2?: any) {

        var timer: Integrations.WebToolIssueTimer;
        if (typeof param1 !== 'string') {
            timer = <Integrations.WebToolIssueTimer>param1;
        }
        else {
            var url = this.normalizeUrl(param1);
            var issue = this.getTabIssue(url, param2);

            timer = <Integrations.WebToolIssueTimer>{ isStarted: this.buttonState != ButtonState.stop };
            for (var i in issue) {
                timer[i] = issue[i];
            }
        }

        this.putData(timer,
            timer => this.connection.putExternalTimer(timer),
            timer => {
                // Show error and exit when timer has no integration
                if (timer.serviceUrl || timer.projectName) {
                    return this.putTimerWithNewIntegration(timer)
                }
            });
    }

    putData<T>(data: T, action: (data: T) => Promise<any>, retryAction?: (data: T) => Promise<any>) {

        var onFail = (status: AjaxStatus, showDialog: boolean) => {

            this._actionOnConnect = null;

            // Zero status when server is unavailable or certificate fails (#59755). Show dialog in that case too.
            if (!status || status.statusCode == HttpStatusCode.Unauthorized || status.statusCode == 0) {

                var disconnectPromise = this.connection.disconnect();

                if (showDialog) {
                    disconnectPromise.then(() => {
                        this._actionOnConnect = () => onConnect(false);
                        this.showLoginDialog();
                    });
                };
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

        var onConnect = (showDialog: boolean) => {

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

    updateState() {
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

    getLoginUrl(): string {
        return this.serviceUrl + 'login';
    }

    private putTimerWithNewIntegration(timer: Integrations.WebToolIssueTimer) {

        return this.connection.getIntegration(<Models.IntegratedProjectIdentifier>{
            serviceUrl: timer.serviceUrl,
            serviceType: timer.serviceType,
            projectName: timer.projectName,
            showIssueId: timer.showIssueId
        }).then(status => {

            var notification: string;

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
                    var statusText = status.projectStatus == Models.ProjectStatus.Archived ? 'archived' : 'readonly';
                    notification = `Cannot assign the task to the ${statusText} project '${timer.projectName}'.\n\n${contactAdmin}`;
                    timer.projectName = undefined;
                }
                else if (status.projectRole == null) {
                    notification = `You are not a member of the project '${timer.projectName}.\n\n${contactAdmin}`
                    timer.projectName = undefined;
                }
            }

            var promise = this.connection.setAccountToPost(status.accountId);

            if (!timer.serviceUrl != !status.integrationType ||
                !timer.projectName != !status.projectStatus) {

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
                    return this.connection.putExternalTimer(timer);
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
        });
    }

    private normalizeUrl(url: string) {
        if (url) {
            var i = url.indexOf('#');
            if (i > 0) {
                url = url.substring(0, i);
            }
        }
        return url;
    }

    private getTabIssue(url: string, title: string): Integrations.WebToolIssue {
        return { issueName: title || this.normalizeUrl(url) };
    }

    private getDuration(timer: Models.Timer): number
    private getDuration(timeEntries: Models.TimeEntry[]): number
    private getDuration(arg: any): any {
        if (arg) {
            var now = new Date().getTime();
            if ((<Models.TimeEntry[]>arg).reduce) {
                return (<Models.TimeEntry[]>arg).reduce((duration, entry) => {
                    var startTime = Date.parse(entry.startTime);
                    var endTime = entry.endTime ? Date.parse(entry.endTime) : now;
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
        var result = status && (status.statusText || status.statusCode);
        if (result) {
            return result.toString();
        }
        return 'Connection to the server failed or was aborted.';
    }

    // issues durations cache

    private _issuesDurationsCache: { [key: string]: Integrations.WebToolIssueDuration } = {};

    private makeIssueDurationKey(identifier: Integrations.WebToolIssueIdentifier): string {
        return identifier.serviceUrl + '/' + identifier.issueUrl;
    }

    private getIssueDurationFromCache(identifier: Integrations.WebToolIssueIdentifier): Integrations.WebToolIssueDuration {
        return this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
    }

    private putIssuesDurationsToCache(durations: Integrations.WebToolIssueDuration[]) {
        durations.forEach(duration => {
            this._issuesDurationsCache[this.makeIssueDurationKey(duration)] = duration;
        });
    }

    private removeIssuesDurationsFromCache(identifiers: Integrations.WebToolIssueIdentifier[]) {
        identifiers.forEach(identifier => {
            delete this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
        });
    }

    private clearIssuesDurationsCache() {
        this._issuesDurationsCache = {};
    }

    getIssuesDurations(identifiers: Integrations.WebToolIssueIdentifier[]): Promise<Integrations.WebToolIssueDuration[]> {

        let durations = <Integrations.WebToolIssueDuration[]>[];
        let fetchIdentifiers = <Integrations.WebToolIssueIdentifier[]>[];

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

        return new Promise<Integrations.WebToolIssueDuration[]>(resolve => {
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

    // popup action listeners

    private _popupActions = {};

    listenPopupAction<TParams, TResult>(action: string, handler: (TParams) => Promise<TResult>) {
        this._popupActions[action] = handler;
    }

    onPopupRequest(request: IPopupRequest, callback: (response: IPopupResponse) => void) {
        var action = request.action;
        var handler = this._popupActions[action];
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

    private getPopupData(): Promise<IPopupInitData> {
        return new Promise<IPopupInitData>((resolve, reject) => {
            this.getActiveTabTitle().then((title) => {
                resolve({
                    title: title,
                    timer: this._timer,
                    timeFormat: this._userProfile && this._userProfile.timeFormat,
                    projects: this._projects
                        .filter(project => project.projectStatus == Models.ProjectStatus.Open)
                        .sort((a, b) => a.projectName.localeCompare(b.projectName, [], { sensitivity: 'base' })),
                    tags: this._tags,
                    constants: this._constants
                });
            });
        });
    }

    initializePopupAction(): Promise<IPopupInitData> {
        return new Promise((resolve, reject) => {
            // Forget about old action when user open popup again
            this._actionOnConnect = null;
            if (this._timer) {
                resolve(this.getPopupData());
            } else {
                reject('Not connected');
            }
        });
    }

    openTrackerPagePopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }

    openPagePopupAction(url) {
        return Promise.resolve(null).then(() => {
            this.openPage(url);
        });
    }

    isConnectionRetryEnabledPopupAction(): Promise<boolean> {
        return this.connection.isConnectionRetryEnabled();
    }

    retryConnectionPopupAction() {
        return this.connection.retryConnection();
    }

    showLoginDialog() {
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

                this.createPopupWindow(width, height, left, top);
            }
            catch (e) {
                this.loginWindowPending = false;
            }
        });
    }

    loginPopupAction() {
        return Promise.resolve(null).then(() => {
            this.connection.reconnect().catch(() => this.showLoginDialog());
        });
    }

    fixTimerPopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }

    putTimerPopupAction(timer: Models.Timer) {
        return Promise.resolve(null).then(() =>
            this.putData(timer, timer => this.connection.putTimer(timer)));
    }

    setButtonIcon(icon: string, tooltip: string) {
        chrome.browserAction.setIcon({
            path: {
                '19': 'images/' + icon + '19.png',
                '38': 'images/' + icon + '38.png'
            }
        });
        chrome.browserAction.setTitle({ title: tooltip });
    }

    sendToTabs(message: ITabMessage, tabId?: any) {
        if (tabId != null) {
            chrome.tabs.sendMessage(tabId, message);
        }
        else {
            chrome.tabs.query({}, tabs => tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, message);
            }));
        }
    }

    getTestValue(name: string): any {
        return localStorage.getItem(name);
    }

    getActiveTabTitle() {
        return new Promise<string>((resolve, reject) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    var activeTab = tabs[0];
                    var title = activeTab && activeTab.title;
                    resolve(title);
                });
        });
    }

    getActiveTabId() {
        return new Promise<number>((resolve, reject) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    var activeTab = tabs[0];
                    var id = activeTab && activeTab.id;
                    resolve(id);
                });
        });
    }

    openPage(url: string) {
        chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }, tabs => {

            var currentWindowId = tabs && tabs.length && tabs[0].windowId;

            // chrome.tabs.query do not support tab search with hashed urls
            // https://developer.chrome.com/extensions/match_patterns
            chrome.tabs.query({ url: url.split('#')[0] }, tabs => {
                // filter tabs queried without hashes by actual url
                var pageTabs = tabs.filter(tab => tab.url == url);
                if (pageTabs.length) {

                    var anyWindowTab: chrome.tabs.Tab, anyWindowActiveTab: chrome.tabs.Tab, currentWindowTab: chrome.tabs.Tab, currentWindowActiveTab: chrome.tabs.Tab;
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

                    var tabToActivate = currentWindowActiveTab || currentWindowTab || anyWindowActiveTab || anyWindowTab;
                    chrome.windows.update(tabToActivate.windowId, { focused: true });
                    chrome.tabs.update(tabToActivate.id, { active: true });
                } else {
                    chrome.tabs.create({ active: true, windowId: currentWindowId, url });
                }
            });
        });
    }

    registerTabsUpdateListener() {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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

    registerTabsRemoveListener() {
        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
            if (tabId == this.loginTabId) {
                this.loginTabId = null;
                this.loginWinId = null;
                this.connection.reconnect();
            }
        });
    }

    registerMessageListener() {
        chrome.runtime.onMessage.addListener((message: ITabMessage | IPopupRequest, sender: chrome.runtime.MessageSender, senderResponse: (IPopupResponse) => void) => {

            if (sender.tab) {
                if (sender.tab.id == this.loginTabId) { // Ignore login dialog
                    return;
                }

                var tabId = sender.tab.id;
                this.onTabMessage(message, tabId);
            }
            else if (this.isPopupRequest(sender)) {
                this.onPopupRequest(message, senderResponse);
                return !!senderResponse;
            }
        });
    }
}