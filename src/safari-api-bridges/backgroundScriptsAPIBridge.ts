class SafariBridge {

    winCounter = 1;
    winToId = new WeakMap<SafariBrowserWindow, number>();
    idToWin: { [id: number]: SafariBrowserWindow } = {};

    tabCounter = 1;
    tabToId = new WeakMap<SafariWebPageProxy, number>();
    idToTab: { [id: number]: SafariWebPageProxy } = {};

    constructor() {

        // Listen messages from content scripts
        safari.application.addEventListener('message', (messageEvent: SafariMessage) => {
            let target = <SafariBrowserTab>messageEvent.target;
            let sender = <chrome.runtime.MessageSender>{
                tab: {
                    id: this.getTabId(target.page),
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

    getWinId(win: SafariBrowserWindow) {
        let id = this.winToId.get(win);
        if (!id) {
            id = this.winCounter++;
            this.winToId.set(win, id);
        }
        return id;
    }

    findWindowById(id: number) {
        let window = this.idToWin[id];
        if (!window) {
            this.getWindows(false, () => window = this.idToWin[id]);
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
            let id = this.getWinId(window);
            this.idToWin[id] = window;
        });
        try {
            callback(windows);
        }
        finally {
            this.idToWin = {};
        }
    }

    getTabId(tab: SafariWebPageProxy) {
        let id = this.tabToId.get(tab);
        if (!id) {
            id = this.tabCounter++;
            this.tabToId.set(tab, id);
        }
        return id;
    }

    findTabById(id: number) {
        let tab = this.idToTab[id];
        if (!tab) {
            this.getTabs({}, () => tab = this.idToTab[id]);
        }
        return tab;
    }

    findTabByProxy(id: number) {
        for (let window of safari.application.browserWindows) {
            for (let tab of window.tabs) {
                if (this.getTabId(tab.page) == id) {
                    return tab;
                }
            }
        }
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
                for (let tab of windowTabs) {
                    if (queryInfo.url && tab.url != queryInfo.url) {
                        return false;
                    }
                    return true;
                }
            }));
        }

        tabs.forEach(tab => {
            let id = this.getTabId(tab.page);
            this.idToTab[id] = tab.page;
        });
        try {
            callback(tabs);
        }
        finally {
            this.idToTab = {};
        }
    }

    messageHandlers: ((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => void)[] = [];

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
            if (!window) {
                return;
            }

            // TODO: support left, top, width, height
            if (updateInfo.focused) {
                window.activate();
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
                            id: safariBridge.getWinId(window),
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
            tab && tab.dispatchMessage('message', message);
        },

        query: (queryInfo, callback) => {

            Promise.resolve().then(() => {

                safariBridge.getTabs(queryInfo, tabs => {

                    // TODO: fill other properties
                    let chromeTabs = tabs.map(tab => <chrome.tabs.Tab>{
                        id: this.getTabId(tab.page),
                        windowId: safariBridge.getWinId(tab.browserWindow),
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
            if (!window) {
                return;
            }

            // TODO:
            // chrome.tabs.create({ active: true, windowId: currentWindowId, url });
        },

        update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties) => {

            let tab = safariBridge.findTabByProxy(tabId);
            if (!tab) {
                return;
            }

            if (updateProperties.active) {
                tab.activate();
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