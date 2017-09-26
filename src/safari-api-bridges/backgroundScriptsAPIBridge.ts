class SafariBridge {

    private _windowCounter = 1;
    private _windowToId = new WeakMap<SafariBrowserWindow, number>();
    private _idToWindow: { [id: number]: SafariBrowserWindow } = {};

    private _tabCounter = 1;
    private _tabToId = new WeakMap<SafariBrowserTab, number>();
    private _idToTab: { [id: number]: SafariBrowserTab } = {};

    messageHandlers: ((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => void)[] = [];

    constructor() {

        // Listen messages from content scripts
        safari.application.addEventListener('message', (messageEvent: SafariMessage) => {
            if (messageEvent.name != 'api_bridge') {
                return;
            }
            let target = <SafariBrowserTab>messageEvent.target;
            let sender = <chrome.runtime.MessageSender>{
                tab: {
                    id: this.getTabId(target),
                    index: null,
                    pinned: null,
                    highlighted: null,
                    windowId: null,
                    active: null,
                    incognito: null,
                    selected: null
                },
                url: target.url
            }
            this.onMessage(messageEvent.message, sender);
        }, false);
    }

    getWindowId(win: SafariBrowserWindow) {
        let id = this._windowToId.get(win);
        if (!id) {
            id = this._windowCounter++;
            this._windowToId.set(win, id);
        }
        return id;
    }

    findWindowById(id: number) {
        let window = this._idToWindow[id];
        if (!window) {
            this.getWindows(false, () => window = this._idToWindow[id]);
        }
        return window;
    }

    getWindows(onlyActive: boolean, callback: (windows: SafariBrowserWindow[]) => void) {

        let windows: SafariBrowserWindow[];

        if (onlyActive) {
            let window = safari.application.activeBrowserWindow;
            windows = window ? [window] : [];
        }
        else {
            windows = safari.application.browserWindows;
        }

        windows.forEach(window => {
            let id = this.getWindowId(window);
            this._idToWindow[id] = window;
        });
        try {
            callback(windows);
        }
        finally {
            this._idToWindow = {};
        }
    }

    getTabId(tab: SafariBrowserTab) {
        let id = this._tabToId.get(tab);
        if (!id) {
            id = this._tabCounter++;
            this._tabToId.set(tab, id);
        }
        return id;
    }

    findTabById(id: number) {
        let tab = this._idToTab[id];
        if (!tab) {
            this.getTabs({}, () => tab = this._idToTab[id]);
        }
        return tab;
    }

    getTabs(queryInfo: chrome.tabs.QueryInfo, callback: (tabs: SafariBrowserTab[]) => void) {

        let tabs: SafariBrowserTab[] = []

        let windows: SafariBrowserWindow[];
        if (queryInfo.currentWindow || queryInfo.windowId === chrome.windows.WINDOW_ID_CURRENT) {
            let window = safari.application.activeBrowserWindow;
            windows = window ? [window] : [];
        } else {
            windows = safari.application.browserWindows;
        }

        for (let window of windows) {
            let windowTabs: SafariBrowserTab[];
            if (queryInfo.active) {
                let activeTab = window.activeTab;
                windowTabs = activeTab ? [activeTab] : [];
            } else {
                windowTabs = window.tabs;
            }

            tabs.push(...windowTabs.filter(tab => {
                if (queryInfo.url && tab.url != queryInfo.url) {
                    return false;
                }
                return true;
            }));
        }

        tabs.forEach(tab => {
            let id = this.getTabId(tab);
            this._idToTab[id] = tab;
        });
        try {
            callback(tabs);
        }
        finally {
            this._idToTab = {};
        }
    }

    onMessage(message: any, sender: chrome.runtime.MessageSender, responseCallback?: (response: any) => void) {
        this.messageHandlers.forEach(handler => handler(message, sender, responseCallback));
    }
}

interface Window {
    safariBridge: SafariBridge;
}
declare var safariBridge: SafariBridge;
window.safariBridge = new SafariBridge();

window.chrome = <typeof chrome>{

    runtime: {

        onMessage: {

            addListener: (handler) => {
                safariBridge.messageHandlers.push(handler);
            },
        }
    },

    windows: {

        WINDOW_ID_CURRENT: -2,

        update: (windowId, updateInfo) => {
            let window = safariBridge.findWindowById(windowId);
            if (window) {
                // TODO: support left, top, width, height
                if (updateInfo.focused) {
                    window.activate();
                }
            }
        },

        getLastFocused: (callback: (window: chrome.windows.Window) => void) => {
            Promise.resolve().then(() => {
                safariBridge.getWindows(true, windows => {
                    let chromeWindow = <chrome.windows.Window>null;
                    let window = windows[0];
                    // TODO: support left, top, width, height
                    if (window) {
                        chromeWindow = {
                            id: safariBridge.getWindowId(window),
                            left: 0,
                            top: 0,
                            width: 1000,
                            height: 800,
                            focused: true,
                            state: null,
                            alwaysOnTop: null,
                            incognito: null,
                            type: null
                        };
                    }
                    callback(chromeWindow);
                });
            });
        }
    },

    tabs: {

        sendMessage: (tabId: number, message: any) => {
            let tab = safariBridge.findTabById(tabId);
            tab && tab.page.dispatchMessage('api_bridge', message);
        },

        query: (queryInfo, callback) => {
            Promise.resolve().then(() => {
                safariBridge.getTabs(queryInfo, tabs => {
                    let chromeTabs = tabs.map(tab => <chrome.tabs.Tab>{
                        id: this.getTabId(tab.page),
                        windowId: safariBridge.getWindowId(tab.browserWindow),
                        title: tab.title,
                        url: tab.url,
                        index: null,
                        pinned: null,
                        highlighted: null,
                        active: null,
                        incognito: null,
                        selected: null
                    });
                    callback(chromeTabs);
                });
            });
        },

        create: (createProperties) => {
            let window = safariBridge.findWindowById(createProperties.windowId);
            if (window) {
                let tab = window.openTab(createProperties.active ? 'foreground' : 'background');
                tab.url = createProperties.url;
            }
        },

        update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties) => {
            let tab: SafariBrowserTab;
            for (let window of safari.application.browserWindows) {
                let tab = safariBridge.findTabById(tabId);
                if (tab) {
                    if (updateProperties.active) {
                        tab.activate();
                    }
                    break;
                }
            }
        },

        remove: (tabId: number) => {
            // TODO:
        },

        onUpdated: {
            addListener: (handler) => {
                // TODO: support tabId, changeInfo.url
            }
        },

        onRemoved: {
            addListener: (handler) => {
                // TODO: support tabId
            }
        },
    },

    browserAction: {

        setIcon: (details) => {
            // TODO:
        },

        setTitle: (details) => {
            // TODO:
        }
    },

    notifications: {

        create: (notificationId: string, options: NotificationOptions, callback?: (notificationId: string) => void) => {
            // TODO:
        },

        clear: (notificationId: string, options: NotificationOptions, callback?: (notificationId: string) => void) => {
            // TODO:
        }
    }
}