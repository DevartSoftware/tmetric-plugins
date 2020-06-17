const enum ButtonState { start, stop, fixtimer, connect }

abstract class ExtensionBase extends BackgroundBase {

    protected getConstants() {
        let constants = super.getConstants();
        return <Models.Constants>{
            maxTimerHours: constants.maxTimerHours,
            serviceUrl: this.getUrl('tmetric.url', constants.serviceUrl),
            storageUrl: this.getUrl('tmetric.storageUrl', constants.storageUrl),
            extensionName: this.getExtensionName(),
            browserSchema: this.getBrowserSchema(),
            extensionUUID: this.getExtensionUUID()
        };
    }

    protected getExtensionName() {
        return chrome.runtime.getManifest().name;
    }

    protected abstract getBrowserSchema(): string

    protected abstract getExtensionUUID(): string

    protected getUrl(key, defaultValue) {
        return this.normalizeUrlLastSlash(this.getTestValue(key) || defaultValue);
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

    protected lastNotificationId: string;

    protected connection: SignalRConnection;

    private buttonState = ButtonState.start;

    private loginTabId: number;

    private loginWinId: number;

    private loginWindowPending: boolean;

    protected signalRUrl: string;

    protected extraHours: number;

    protected timeEntries: Models.TimeEntry[];

    constructor() {

        super();

        this.listenPopupAction<void, boolean>('isConnectionRetryEnabled', this.isConnectionRetryEnabledPopupAction);
        this.listenPopupAction<void, void>('retry', this.retryConnectionPopupAction);

        this.updateState();

        this.connection.onUpdateTimer(async timer => {

            // looks like disconnect
            if (timer == null) {
                this.clearIssuesDurationsCache();
            }

            this.timer = timer;

            if (timer && timer.details) {
                let project = await this.getProject(timer.details.projectId);
                timer.projectName = project && project.projectName;
            }

            this.updateState();
            this.sendToTabs({ action: 'setTimer', data: timer });

            // timer should be received from server on connect
            if (timer) {
                let action = this.actionOnConnect;
                if (action) {
                    this.actionOnConnect = null;
                    action();
                }
            }
        });

        this.connection.onUpdateTracker(timeEntries => {
            this.timeEntries = timeEntries;
            this.updateState();
        });

        this.connection.onUpdateProfile(profile => {
            this.userProfile = profile;
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

        this.registerTabsUpdateListener();
        this.registerTabsRemoveListener();

        this.registerContentScripts();

        // Update hint once per minute
        let setUpdateTimeout = () => setTimeout(() => {
            this.updateState();
            setUpdateTimeout();
        }, (60 - new Date().getSeconds()) * 1000);

        setUpdateTimeout();
    }

    protected init() {

        super.init();

        this.signalRUrl = this.getUrl('tmetric.signalRUrl', 'https://services.tmetric.com/signalr/');

        this.extraHours = this.getTestValue('tmetric.extraHours');
        if (this.extraHours) {
            this.extraHours = parseFloat(<any>this.extraHours);
        }
        else {
            this.extraHours = 0;
        }
    }

    protected initConnection() {

        this.connection = new SignalRConnection();

        this.connection
            .init({ serviceUrl: this.constants.serviceUrl, signalRUrl: this.signalRUrl })
            .then(() => this.connection.getVersion())
            .then(() => this.checkPermissions())
    }

    /** Handles messages from in-page scripts */
    private onTabMessage(message: ITabMessage, tabId: number) {

        this.sendToTabs({ action: message.action + '_callback' }, tabId);

        switch (message.action) {

            case 'getConstants':
                this.sendToTabs({ action: 'setConstants', data: this.constants }, tabId);
                break;

            case 'getTimer':
                this.sendToTabs({ action: 'setTimer', data: this.timer }, tabId);
                break;

            case 'putTimer':
                this.putExternalTimer(message.data, null, tabId);
                break;

            case 'getIssuesDurations':
                this.getIssuesDurations(message.data).then(durations => {

                    // show extra time on link for test purposes
                    if (this.extraHours && this.timer && this.timer.isStarted) {
                        let activeDetails = this.timer.details;
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

    protected isLongTimer() {
        return this.buttonState == ButtonState.fixtimer;
    }

    protected async putExternalTimer(timer: WebToolIssueTimer, accountId: number = null, tabId: number = null) {

        // Stop timer without any checks (TE-339)
        if (!timer.isStarted) {
            timer = <WebToolIssueTimer>{ isStarted: false }
        }

        this.putData(timer, async timer => {

            try {
                var status = await this.getIntegrationStatus(timer, accountId);
                var scope = await this.getAccountScope(status.accountId);
            } catch (err) {
                this.connection.checkProfileChange(); // TE-179
                return Promise.reject(err);
            }

            if (accountId) {
                return this.putTimerWithIntegration(timer, status, scope.requiredFields);
            }

            if (timer.isStarted) {

                let settings = await this.getSettings();

                // Set default work type before popup show (TE-299)
                await this.validateTimerTags(timer, status.accountId);

                const matchedProjectCount = this.getTrackedProjects(scope).filter(p => p.projectName == timer.projectName).length;
                const requiredFields = scope.requiredFields;
                let showPopup = settings.showPopup || Models.ShowPopupOption.Always;

                if (requiredFields.taskLink && !timer.issueUrl) {
                    showPopup = Models.ShowPopupOption.Never;
                } else if (
                    requiredFields.description && !timer.issueName && !timer.description ||
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

                        this.validateTimerProject(timer, status);

                        // This timer will be send when popup ask for initial data
                        this.newPopupIssue = timer;

                        // This account id will be used to prepare initial data for popup
                        this.newPopupAccountId = status.accountId;

                        return this.showPopup(tabId);
                    }
                }
            }

            return this.putTimerWithIntegration(timer, status, scope.requiredFields);
        });
    }

    protected putData<T>(data: T, action: (data: T) => Promise<any>, retryAction?: (data: T) => Promise<any>) {

        let onFail = (status: AjaxStatus, showDialog: boolean) => {

            this.actionOnConnect = null;

            // Zero status when server is unavailable or certificate fails (#59755). Show dialog in that case too.
            if (!status || status.statusCode == HttpStatusCode.Unauthorized || status.statusCode == 0) {

                let disconnectPromise = this.connection.disconnect();

                if (showDialog) {
                    disconnectPromise.then(() => {
                        this.actionOnConnect = () => onConnect(false);
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
                this.actionOnConnect = () => this.fixTimer();
                this.connection.getData().catch(status => onFail(status, showDialog));
                return;
            }

            action(data).catch(status => onFail(status, showDialog));
        };

        if (this.timer == null) {
            // connect before action to get actual state
            this.actionOnConnect = () => onConnect(true);
            this.connection.reconnect().catch(status => onFail(status, true));
        }
        else {
            onConnect(true);
        }
    }

    private updateState() {
        let state = ButtonState.connect;
        let text = 'Not Connected';
        if (this.timer) {
            let todayTotal = 'Today Total - '
                + this.durationToString(this.getDuration(this.timeEntries))
                + ' hours';
            if (this.timer.isStarted) {
                if (this.getDuration(this.timer) > this.constants.maxTimerHours * 60 * 60000) {
                    state = ButtonState.fixtimer;
                    text = 'Started\nYou need to fix long-running timer';
                }
                else {
                    state = ButtonState.stop;
                    let description = this.timer.details.description || '(No task description)';
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
        return this.constants.serviceUrl + 'login';
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

    protected showLoginDialog() {
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

                let width = 420;
                let height = 635;
                let left = 400;
                let top = 250;

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

    protected getTestValue(name: string): any {
        return localStorage.getItem(name);
    }

    protected getActiveTabTitle() {
        return new Promise<string>((resolve, reject) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    let activeTab = tabs && tabs[0];
                    let title = activeTab && activeTab.title || null;
                    resolve(title);
                });
        });
    }

    protected getActiveTabId() {
        return new Promise<number>((resolve, reject) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    let activeTab = tabs && tabs[0];
                    let id = activeTab && activeTab.id || null;
                    resolve(id);
                });
        });
    }

    protected getActiveTabUrl() {
        return new Promise<string>((resolve, reject) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    let activeTab = tabs && tabs[0];
                    let url = activeTab && activeTab.url || null;
                    resolve(url);
                });
        });
    }

    protected async getActiveTabPossibleWebTool() {

        const url = await this.getActiveTabUrl();
        const origin = WebToolManager.toOrigin(url);
        if (!origin) {
            return;
        }

        const isMatchUrl = (origin: string) => WebToolManager.isMatch(url, origin);

        const enabledWebTools = await WebToolManager.getEnabledWebTools();
        const enabledWebTool = enabledWebTools.find(webTool => webTool.origins.some(isMatchUrl));
        if (enabledWebTool) {
            return;
        }

        const webTools = getWebToolDescriptions();
        const webTool = webTools.find(webTool => webTool.origins.some(isMatchUrl));
        if (webTool) {
            return <WebToolInfo>{
                serviceType: webTool.serviceType,
                serviceName: webTool.serviceName,
                origins: [origin]
            };
        }
    }

    protected openPage(url: string) {

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
                let serviceUrl = this.constants.serviceUrl.toLowerCase();
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

    // permissions

    private async checkPermissions() {

        chrome.storage.local.get(<IExtensionLocalSettings>{ skipPermissionsCheck: false }, async ({ skipPermissionsCheck }: IExtensionLocalSettings) => {

            if (!skipPermissionsCheck) {

                chrome.storage.local.set(<IExtensionLocalSettings>{ skipPermissionsCheck: true });

                if (this.connection.userProfile) {
                    this.showPermissions();
                } else {
                    this.actionOnConnect = () => this.showPermissions();
                    this.showLoginDialog();
                }
            }
        });
    }

    private async showPermissions() {

        try {
            let integrations = await this.connection.getIntegrations();

            let webToolsDictionary = integrations.reduce((result, item) => {

                const { serviceType, serviceUrl } = item;

                const origin = WebToolManager.toOrigin(serviceUrl);
                if (!origin) {
                    return result;
                }

                const entry = result[serviceType];
                if (entry) {
                    if (entry.origins.indexOf(origin) == -1) {
                        entry.origins.push(origin);
                    }
                } else {
                    result[serviceType] = {
                        serviceType,
                        origins: [origin]
                    };
                }

                return result;
            }, <{ [serviceType: string]: WebTool }>{});

            const webTools = Object.keys(webToolsDictionary).map(key => webToolsDictionary[key]);

            await WebToolManager.enableWebTools(webTools);
        } catch (error) {
            console.log(error)
        }

        let url = chrome.runtime.getURL('permissions/permissionsCheck.html');
        chrome.tabs.create({ url, active: true });
    }

    private contentScriptRegistrator = new ContentScriptsRegistrator();

    protected registerContentScripts() {
        this.contentScriptRegistrator.register();
    }

    protected onContentScriptRegistratorMessage(message: IContentScriptRegistratorMessage) {
        if (message.action == 'registerContentScripts') {
            this.contentScriptRegistrator.register(message.data);
        } else if (message.action == 'unregisterContentScripts') {
            this.contentScriptRegistrator.unregister(message.data);
        }
    }

    protected registerMessageListener() {
        chrome.runtime.onMessage.addListener((
            message: ITabMessage | IPopupRequest | IExtensionSettingsMessage | IContentScriptRegistratorMessage,
            sender: chrome.runtime.MessageSender,
            senderResponse: (IPopupResponse) => void
        ) => {

            console.log(message, sender)

            // Popup requests
            if (!sender.url || sender.url.startsWith(chrome.runtime.getURL('popup'))) {
                this.onPopupRequest(message, senderResponse);
                return !!senderResponse;
            }

            if (sender.url.startsWith(chrome.runtime.getURL('permissions'))) {
                this.onContentScriptRegistratorMessage(<IContentScriptRegistratorMessage>message);
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

    protected openOptionsPagePopupAction() {
        chrome.runtime.openOptionsPage();
        return Promise.resolve(null);
    }

    protected showPopup(tabId?: number): void {
        this.sendToTabs({ action: 'showPopup' }, tabId);
    }

    protected hidePopup(tabId?: number): void {
        this.sendToTabs({ action: 'hidePopup' }, tabId);
    }

    private isConnectionRetryEnabledPopupAction(): Promise<boolean> {
        return this.connection.isConnectionRetryEnabled();
    }

    private retryConnectionPopupAction() {
        return this.connection.retryConnection();
    }
}