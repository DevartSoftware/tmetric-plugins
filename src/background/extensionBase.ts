const enum ButtonState { start, stop, fixtimer, connect }
const invalidProfileError = 'Profile not configured';

async function getTestValues() {

    const getUrl = async key => {
        let url = await storage.getItem(key);
        if (!url) {
            return;
        }
        if (url[url.length - 1] != '/') {
            url += '/';
        }
        return url;
    }

    const extraHours = await storage.getItem('tmetric.extraHours');

    return {
        serviceUrl: await getUrl('tmetric.url'),
        storageUrl: await getUrl('tmetric.storageUrl'),
        authorityUrl: await getUrl('tmetric.authorityUrl'),
        signalRUrl: await getUrl('tmetric.signalRUrl'),
        extraHours: extraHours ? parseFloat(extraHours) : 0
    } as TestValues;
}

abstract class ExtensionBase extends BackgroundBase {

    protected getConstants() {
        const constants = super.getConstants();
        return <Models.Constants>{
            maxTimerHours: constants.maxTimerHours,
            serviceUrl: this._testValues.serviceUrl || constants.serviceUrl,
            storageUrl: this._testValues.storageUrl || constants.storageUrl,
            authorityUrl: this._testValues.authorityUrl || constants.authorityUrl,
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

    private createLoginDialog() {

        chrome.tabs.create(
            { url: OidcClient.getLoginUrl() } as chrome.tabs.CreateProperties,
            tab => {
                this.loginWinId = tab.windowId;
                this.loginTabId = tab.id;
                this.loginWindowPending = false;
            }
        );
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
        const type = 'basic';
        const iconUrl = 'images/icon80.png';
        chrome.notifications.create(
            null,
            { title, message, type, iconUrl },
            id => this.lastNotificationId = id);
    }

    protected lastNotificationId: string;

    protected connection: SignalRConnection;

    private buttonState = ButtonState.start;

    private loginTabId: number;

    private settingsTabId: number;

    private loginWinId: number;

    private loginWindowPending: boolean;

    protected signalRUrl: string;

    protected extraHours: number;

    protected timeEntries: Models.TimeEntry[];

    constructor(testValues: TestValues) {

        super(testValues);

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
                const project = await this.getProject(timer.details.projectId);
                timer.projectName = project && project.projectName;
            }

            this.updateState();
            this.sendToTabs({ action: 'setTimer', data: timer });

            // timer should be received from server on connect
            if (timer) {
                const action = this.actionOnConnect;
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

        this.connection.onUpdateActiveAccount(() => {
            this.clearIssuesDurationsCache();
        });

        this.connection.onInvalidateAccountScopeCache(accountId => {
            this.invalidateAccountScopeCache(accountId);
        });

        this.connection.onRemoveExternalIssuesDurations(identifiers => {
            this.removeIssuesDurationsFromCache(identifiers);
        });

        this.registerInstallListener();

        this.registerStorageListener();

        this.registerTabsRemoveListener();

        this.registerContentScripts();

        // Update hint once per minute
        const setUpdateTimeout = () => setTimeout(() => {
            this.updateState();
            setUpdateTimeout();
        }, (60 - new Date().getSeconds()) * 1000);

        setUpdateTimeout();
    }

    protected init() {

        super.init();

        this.signalRUrl = this._testValues.signalRUrl || 'https://services.tmetric.com/signalr/';
        this.extraHours = this._testValues.extraHours || 0;
    }

    protected initConnection() {

        this.connection = new SignalRConnection();

        this.connection
            .init({ serviceUrl: this.constants.serviceUrl, signalRUrl: this.signalRUrl, authorityUrl: this.constants.authorityUrl });
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
                        const activeDetails = this.timer.details;
                        if (activeDetails && activeDetails.projectTask) {
                            const activeTask = activeDetails.projectTask;
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
        return new Promise<IExtensionSettings>((resolve) => {
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

            let status: Models.IntegratedProjectStatus;
            let scope: Models.AccountScope;
            try {
                status = await this.getIntegrationStatus(timer, accountId);
                scope = await this.getAccountScope(status.accountId);
            } catch (err) {
                this.connection.checkProfileChange(); // TE-179
                return Promise.reject(err);
            }

            if (accountId) {
                return this.putTimerWithIntegration(timer, status, scope.requiredFields);
            }

            if (timer.isStarted) {

                const settings = await this.getSettings();

                // Set default work type before popup show (TE-299)
                await this.validateTimerTags(timer, status.accountId);

                const matchedProjectCount = this.getTrackedProjects(scope).filter(p => p.projectName == timer.projectName).length;
                const requiredFields = scope.requiredFields;
                let showPopup = settings.showPopup || Models.ShowPopupOption.Always;

                if (timer.serviceType === 'Shortcut') {
                    // TODO: popup is not working on Shortcut pages (TMET-7517)
                    showPopup = Models.ShowPopupOption.Never;
                } else if (requiredFields.taskLink && !timer.issueUrl) {
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

        const onFail = (status: AjaxStatus | string, showDialog: boolean) => {

            this.actionOnConnect = null;

            if (status == invalidProfileError && showDialog) {
                chrome.tabs.create({ url: this.constants.serviceUrl });
            }
            // Zero status when server is unavailable or certificate fails (#59755). Show dialog in that case too.
            else if (!status
                || typeof (status) === 'string'
                || status.statusCode == HttpStatusCode.Unauthorized
                || status.statusCode == 0) {

                const disconnectPromise = this.connection.disconnect();
                if (showDialog) {
                    disconnectPromise.then(() => {
                        this.actionOnConnect = () => onConnect(false);
                        this.showLoginDialog();
                    });
                }
            }
            else {

                const error = this.getErrorText(status);

                if (status.statusCode == HttpStatusCode.Forbidden && retryAction) {
                    const promise = retryAction(data);
                    if (promise) {
                        promise.catch(() => this.showError(error));
                        return;
                    }
                }

                this.showError(error);
            }
        };

        const onConnect = (showDialog: boolean) => {

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
            const todayTotal = 'Today Total - '
                + this.durationToString(this.getDuration(this.timeEntries))
                + ' hours';
            if (this.timer.isStarted) {
                if (this.getDuration(this.timer) > this.constants.maxTimerHours * 60 * 60000) {
                    state = ButtonState.fixtimer;
                    text = 'Started\nYou need to fix long-running timer';
                }
                else {
                    state = ButtonState.stop;
                    const description = this.timer.details.description || '(No task description)';
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

    private getDuration(timer: Models.Timer): number
    private getDuration(timeEntries: Models.TimeEntry[]): number
    private getDuration(arg: any): any {
        if (arg) {
            const now = new Date().getTime();
            if ((<Models.TimeEntry[]>arg).reduce) {
                return (<Models.TimeEntry[]>arg).reduce((duration, entry) => {
                    const startTime = Date.parse(entry.startTime);
                    const endTime = entry.endTime ? Date.parse(entry.endTime) : now;
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

        const totalMinutes = Math.floor(duration / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

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

        const durations = <WebToolIssueDuration[]>[];
        const fetchIdentifiers = <WebToolIssueIdentifier[]>[];

        // Do not show durations of tasks without url
        identifiers = identifiers.filter(_ => !!_.serviceUrl && !!_.issueUrl);

        identifiers.forEach(identifier => {
            const duration = this.getIssueDurationFromCache(identifier);
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

            chrome.tabs.query({ windowId: this.loginWinId }, tabs => {
                const tab = tabs.find(tab => tab.id == this.loginTabId);
                if (tab && tab.url.startsWith(this.constants.authorityUrl)) {
                    chrome.tabs.update(tab.id, { active: true });
                    chrome.windows.update(this.loginWinId, { focused: true });
                } else {
                    this.loginWinId = null;
                    this.loginTabId = null;
                    this.showLoginDialog();
                }
            });

            return;
        }

        chrome.windows.getLastFocused(() => {
            if (this.loginWindowPending) {
                return;
            }
            this.loginWindowPending = true;
            try {
                this.createLoginDialog();
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
                chrome.tabs.sendMessage(tab.id, message, () => {

                    // Ignore errors in broadcast messages
                    const error = chrome.runtime.lastError;
                    if (error) {
                        console.log(`${message.action}: ${error.message}`)
                    }
                });
            }
        }));
    }

    protected getActiveTabTitle() {
        return new Promise<string>((resolve) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    const activeTab = tabs && tabs[0];
                    const title = activeTab && activeTab.title || null;
                    resolve(title);
                });
        });
    }

    protected getActiveTabId() {
        return new Promise<number>((resolve) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    const activeTab = tabs && tabs[0];
                    const id = activeTab && activeTab.id || null;
                    resolve(id);
                });
        });
    }

    protected getActiveTabUrl() {
        return new Promise<string>((resolve) => {
            chrome.tabs.query({ currentWindow: true, active: true },
                function (tabs) {
                    const activeTab = tabs && tabs[0];
                    const url = activeTab && activeTab.url || null;
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

        if (await WebToolManager.isAllowed([origin])) {
            return;
        }

        const isMatchUrl = (origin: string) => WebToolManager.isMatch(url, origin);

        const webTools = getWebToolDescriptions();
        const webTool = webTools.find(webTool => webTool.origins.some(isMatchUrl));
        if (webTool) {
            return <WebToolInfo>{
                serviceType: webTool.serviceType,
                serviceName: webTool.serviceName,
                origins: webTool.allOriginsRequired ? webTool.origins : [origin]
            };
        }
    }

    protected openPage(url: string) {

        chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }, tabs => {

            const currentWindowId = tabs && tabs.length && tabs[0].windowId;

            // chrome.tabs.query do not support tab search with hashed urls
            // https://developer.chrome.com/extensions/match_patterns
            chrome.tabs.query({ url: url.split('#')[0] + '*' }, tabs => {
                // filter tabs queried without hashes by actual url
                const pageTabs = tabs && tabs.filter(tab => tab.url == url);
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

                    const tabToActivate = currentWindowActiveTab || currentWindowTab || anyWindowActiveTab || anyWindowTab;
                    chrome.windows.update(tabToActivate.windowId, { focused: true });
                    chrome.tabs.update(tabToActivate.id, { active: true });
                } else {
                    chrome.tabs.create({ active: true, windowId: currentWindowId, url });
                }
            });
        });
    }

    protected reconnect(showLoginDialog: boolean) {
        this.connection.reconnect()
            .then(async () => {
                const key = 'skipPermissionsSetup';
                const skipPermissionsSetup = await new Promise<boolean>(resolve =>
                    chrome.storage.local.get([key], result => resolve(result[key]))
                );

                if (!skipPermissionsSetup) {
                    chrome.storage.local.set({ [key]: true });
                    const url = chrome.runtime.getURL('permissions/check.html');
                    chrome.tabs.create({ url, active: true });
                }
            })
            .catch(err => {
                if (err === invalidProfileError) {
                    chrome.tabs.create({ url: this.constants.serviceUrl });
                } else if (showLoginDialog) {
                    this.showLoginDialog();
                }
            });
    }

    private registerInstallListener() {
        chrome.runtime.onInstalled.addListener(async details => {
            const neverLoggedIn = await OidcClient.neverLoggedIn();
            if (!neverLoggedIn) {
                chrome.storage.local.set({ 'skipPermissionsSetup': true });
            }
            if (details.reason == 'install' ||
                neverLoggedIn && details.reason == 'update') {
                this.showLoginDialog();
            }
        });
    }

    private registerStorageListener() {
        chrome.storage.onChanged.addListener(async (changes) => {
            const authorizationCode = changes['authorization_code'];
            if (authorizationCode && authorizationCode.newValue) {
                chrome.tabs.remove(this.loginTabId);
                if (await OidcClient.authorize()) {
                    this.reconnect(false);
                }
            }
        });
    }

    private registerTabsRemoveListener() {
        chrome.tabs.onRemoved.addListener((tabId) => {
            if (tabId == this.loginTabId) {
                this.loginTabId = null;
                this.loginWinId = null;
            }
        });
    }

    // permissions

    private async onPermissionsMessage(message: ITabMessage, callback: (data: any) => void) {
        if (message.action == 'getIntegratedServices') {
            const items = await this.getIntegratedServices();
            callback(items);
        }
    }

    private async getIntegratedServices() {
        try {

            const integrations = (await this.connection.getIntegrations()).filter(item => !!WebToolManager.toServiceUrl(item.serviceUrl));
            const descriptions = getWebToolDescriptions().reduce((map, description) => (map[description.serviceType] = description) && map, <{ [serviceType: string]: WebToolDescription }>{});

            const serviceTypesMap = integrations.reduce((map, { serviceType, serviceUrl }) => {

                const description = descriptions[serviceType];
                if (description) {

                    // add known origins
                    description.origins.forEach(origin => map[origin] = serviceType);

                    // add additional origins
                    if (description.hasAdditionalOrigins) {
                        const serviceUrlNormalized = WebToolManager.toServiceUrl(serviceUrl);
                        const isServiceUrlMatchKnownOrigin = description.origins.some(origin => WebToolManager.isMatch(serviceUrl, origin));
                        if (serviceUrlNormalized && !isServiceUrlMatchKnownOrigin) {
                            map[serviceUrlNormalized] = serviceType;
                        }
                    }
                }

                return map;
            }, <ServiceTypesMap>{});

            return serviceTypesMap;
        } catch (error) {
            console.log(error)
        }
    }

    private async openOptionsPageUrl() {
        const url = chrome.runtime.getURL('settings/settings.html');
        this.openPage(url);
    }

    private contentScriptRegistrator = new ContentScriptsRegistrator();

    protected registerContentScripts() {
        this.contentScriptRegistrator.register();
    }

    protected registerMessageListener() {

        chrome.runtime.onMessageExternal.addListener((message: ITabMessage, _sender, sendResponse) => {
            switch (message.action) {
                case 'ping':
                    sendResponse('pong');
                    break;
            }
        });

        chrome.runtime.onMessage.addListener((
            message: ITabMessage | IPopupRequest | IExtensionSettingsMessage,
            sender: chrome.runtime.MessageSender,
            senderResponse: (IPopupResponse) => void
        ) => {

            console.log(message, sender)

            // Popup requests
            if (!sender.url || sender.url.startsWith(chrome.runtime.getURL('popup'))) {
                this.onPopupRequest(message, senderResponse);
                return !!senderResponse;
            }

            if (sender.url && (sender.url.startsWith(chrome.runtime.getURL('permissions')) || sender.url.startsWith(chrome.runtime.getURL('settings')))) {
                this.onPermissionsMessage(message, senderResponse);
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
            const tabId = sender.tab.id;
            this.onTabMessage(message, tabId);

            senderResponse(null);
        });
    }

    protected openOptionsPagePopupAction() {
        this.openOptionsPageUrl()
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