class SafariBridge {

    winCounter = 1;
    winToId = new WeakMap<SafariBrowserWindow, number>();

    tabCounter = 1;
    tabToId = new WeakMap<SafariWebPageProxy, number>();
    idToTab: { [id: number]: SafariWebPageProxy } = {};

    getWinId(win: SafariBrowserWindow) {
        let id = this.winToId.get(win);
        if (!id) {
            id = this.winCounter++;
            this.winToId.set(win, id);
        }
        return id;
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
            this.getTabs(() => tab = this.idToTab[id]);
        }
        return tab;
    }

    getTabs(callback: (tabs: SafariWebPageProxy[]) => void, filter?: any) {

        // TODO:
        let tabs = <SafariWebPageProxy[]>[];

        tabs.forEach(tab => {
            let id = this.getTabId(tab);
            this.idToTab[id] = tab;
        });
        try {
            callback(tabs);
        }
        finally {
            this.idToTab = {};
        }
    }

    onMessage(message: any, responseCallback?: (response: any) => void) {
    }
}

interface Window {
    safariBridge: SafariBridge;
}

window.safariBridge = new SafariBridge();

window.chrome = <typeof chrome>{

    runtime: {

        onMessage: {

            addListener: (handler) => {
                // TODO: support message: any, sender: {url: string, tab: { id: number } }
            }
        }
    },

    windows: {

        WINDOW_ID_CURRENT: -2,

        update: (windowId, updateInfo) => {
            // TODO: support left, top, width, height, focused
        },

        getLastFocused: (callback: (window: chrome.windows.Window) => void) => {
            // TODO: support left, top, width, height
        }
    },

    tabs: {

        sendMessage: (tabId: number, message: any) => {
            // TODO:
        },

        query: (queryInfo, callback) => {
            // TODO:
            // chrome.tabs.query({}, tabs => tabs && tabs.forEach(tab => {
            // chrome.tabs.query({ currentWindow: true, active: true }, tabs =>
            // chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }, tabs => {
            // chrome.tabs.query({ url: url }, tabs => {
        },

        create: (createProperties) => {
            // TODO:
            // chrome.tabs.create({ active: true, windowId: currentWindowId, url });
        },

        update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties) => {
            // TODO:
            // chrome.tabs.update(tabId, { active: true });
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

        create: (a, b, c) => {
            // TODO:
        },

        clear: (notificationId: string, options: NotificationOptions, callback?: (notificationId: string) => void) => {
            // TODO:
        }
    }
}