class ChromeExtension extends ExtensionBase {

    loginTabId: number;

    loginWinId: number;

    loginWindowPending: boolean;

    lastNotificationId: string;

    constructor() {
        super(backgroundPort);

        // Inject content scripts in all already opened pages
        var contentScripts = chrome.runtime.getManifest().content_scripts[0];
        var jsFiles = contentScripts.js;
        var cssFiles = contentScripts.css;
        var runAt = contentScripts.run_at;
        chrome.tabs.query({}, tabs =>
            tabs.forEach(tab => {
                if (tab.url.indexOf('http') == 0) {
                    jsFiles.forEach(file => chrome.tabs.executeScript(tab.id, { file, runAt }));
                    cssFiles.forEach(file => chrome.tabs.insertCSS(tab.id, { file }));
                }
            }));

        this.sendToTabs = (message, tabId?) => {
            if (tabId != null) {
                chrome.tabs.sendMessage(tabId, message);
            }
            else {
                chrome.tabs.query({}, tabs => tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, message);
                }));
            }
        }
        chrome.runtime.onMessage.addListener((message: ITabMessage | IPopupRequest, sender: chrome.runtime.MessageSender, senderResponse: (IPopupResponse) => void) => {
            if (sender.tab) {
                if (sender.tab.id == this.loginTabId) { // Ignore login dialog
                    return;
                }
                var tabId = sender.tab.id;
                this.onTabMessage(message, tabId);
            } else if (sender.url && sender.url.match(/^chrome.+popup.html$/)) {
                this.onPopupRequest(message, senderResponse);
                // http://stackoverflow.com/questions/33614911/sending-message-between-content-js-and-background-js-fails
                return !!senderResponse;
            }
        });

        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
            if (tabId == this.loginTabId) {
                this.loginTabId = null;
                this.loginWinId = null;
                this.reconnect();
            }
        });

        chrome.runtime.onMessageExternal.addListener((request: any, sender: any, sendResponse: Function) => {
            if (request.message == "version") {
                sendResponse({ version: "1.3.3" });
            }
        });

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

        // Update hint once per minute
        var setUpdateTimeout = () => setTimeout(() => {
            this.updateState();
            setUpdateTimeout();
        }, (60 - new Date().getSeconds()) * 1000);
        setUpdateTimeout();

        this.getActiveTabTitle = () => {
            return new Promise((resolve, reject) => {
                chrome.tabs.query({ currentWindow: true, active: true },
                    function (tabs) {
                        var activeTab = tabs[0];
                        var title = activeTab && activeTab.title;
                        resolve(title);
                    });
            });
        }
    }

    showError(message: string) {
        // This needed to prevent alert cleaning via build.
        var a = alert;
        a(message);
    }

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

    showConfirmation(message: string) {
        return confirm(message);
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

                let {width, height, left, top} = this.getDefaultLoginPosition();

                if (pageWindow.left != null && pageWindow.width != null) {
                    left = Math.round(pageWindow.left + (pageWindow.width - width) / 2);
                }
                if (pageWindow.top != null && pageWindow.height != null) {
                    top = Math.round(pageWindow.top + (pageWindow.height - height) / 2);
                }

                chrome.windows.create(<chrome.windows.CreateData>{
                    left,
                    top,
                    width,
                    height,
                    focused: true,
                    url: this.getLoginUrl(),
                    type: 'popup'
                }, popupWindow => {

                    var popupTab = popupWindow.tabs[0];

                    this.loginWinId = popupWindow.id;
                    this.loginTabId = popupTab.id;
                    this.loginWindowPending = false;

                    var deltaWidth = width - popupTab.width;
                    var deltaHeight = height - popupTab.height;

                    chrome.windows.update(popupWindow.id, <chrome.windows.UpdateInfo>{
                        left: left - Math.round(deltaWidth / 2),
                        top: top - Math.round(deltaHeight / 2),
                        width: width + deltaWidth,
                        height: height + deltaHeight
                    });
                });
            }
            catch (e) {
                this.loginWindowPending = false;
            }
        });
    }

    setButtonIcon(icon: string, tooltip: string) {
        chrome.browserAction.setIcon({
            path: {
                '19': 'images/chrome/' + icon + '19.png',
                '38': 'images/chrome/' + icon + '38.png'
            }
        });
        chrome.browserAction.setTitle({ title: tooltip });
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

    getTestValue(name: string): any {
        return localStorage.getItem(name);
    }
}

new ChromeExtension();