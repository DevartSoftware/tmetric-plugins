/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../interfaces/browser.d.ts" />
/// <reference path="../extension-base/ExtensionBase.ts" />
/// <reference path="shamPort.ts" />

class ChromeExtension extends ExtensionBase
{
    loginTabId: number;

    loginWinId: number;

    checkCloseTimeout: number;

    constructor()
    {
        super('https://tt.devart.com/', backgroundPort);

        // Inject content scripts in all already opened pages
        var contentScripts = (<ChromeExtensionManifest>chrome.runtime.getManifest()).content_scripts[0];
        var jsFiles = contentScripts.js;
        var cssFiles = contentScripts.css;
        var runAt = contentScripts.run_at;
        chrome.tabs.query({}, tabs =>
            tabs.forEach(tab =>
            {
                if (tab.url.indexOf('http') == 0)
                {
                    jsFiles.forEach(file => chrome.tabs.executeScript(tab.id, { file, runAt }));
                    cssFiles.forEach(file => chrome.tabs.insertCSS(tab.id, { file }));
                }
            }));

        this.sendToTabs = (message, tabId?) =>
        {
            if (tabId != null)
            {
                chrome.tabs.sendMessage(tabId, message);
            }
            else
            {
                chrome.tabs.query({}, tabs => tabs.forEach(tab =>
                {
                    chrome.tabs.sendMessage(tab.id, message);
                }));
            }
        }

        chrome.runtime.onMessage.addListener((message: ITabMessage, sender: chrome.runtime.MessageSender) =>
        {
            var isActive = false;
            var tabId: number;
            if (sender.tab)
            {
                tabId = sender.tab.id;

                if (sender.tab.id == this.loginTabId) // Ignore login dialog
                {
                    return;
                }
                isActive = sender.tab.active;
            }

            this.onTabMessage(message, tabId, isActive);
        });

        chrome.browserAction.onClicked.addListener(tab =>
        {
            if (this.loginWinId)
            {
                chrome.windows.update(this.loginWinId, { focused: true });
            }
            else
            {
                this.startTimer(tab.url, tab.title);
            }
        });

        chrome.tabs.onRemoved.addListener((tabId, removeInfo) =>
        {
            if (tabId == this.loginTabId)
            {
                this.loginTabId = null;
                this.loginWinId = null;
                this.actionOnConnect();
            }

            if (this.checkCloseTimeout)
            {
                clearTimeout(this.checkCloseTimeout);
            }

            this.checkCloseTimeout = setTimeout(() =>
            {
                this.checkCloseTimeout = null;
                chrome.tabs.query({}, tabs =>
                {
                    var allUrls = tabs.map(tab => tab.url);
                    this.cleanUpTabInfo(allUrls);
                });
            }, 60000);
        });

        var updateCurrentTab = (canReset?: boolean) =>
        {
            chrome.tabs.query({ lastFocusedWindow: true, active: true }, tabs =>
            {
                var tab = tabs[0];
                if (tab)
                {
                    if (tab.id != this.loginTabId)
                    {
                        this.setCurrentTab(tab.url, tab.title);
                    }
                }
                else if (canReset)
                {
                    this.setCurrentTab(null, null);
                }
            });
        };

        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
        {
            if (tabId == this.loginTabId &&
                changeInfo.status == 'loading' &&
                changeInfo.url.indexOf('/Account/') < 0)
            {
                chrome.tabs.remove(tabId);
            }
            else
            {
                updateCurrentTab();
            }
        });

        // When user switch windows, tabs.onUpdated does not fire (#60434)
        chrome.windows.onFocusChanged.addListener(() => updateCurrentTab());

        chrome.tabs.onActivated.addListener(activeInfo =>
        {
            updateCurrentTab(true);
        });

        updateCurrentTab();
    }

    showError(message: string)
    {
        alert(message);
    }

    showNotification(message: string, title?: string)
    {
        title = title || 'Devart Time Tracker';
        var type = 'basic';
        var iconUrl = 'images/icon.png';
        chrome.notifications.create(null, { title, message, type, iconUrl }, null);
    }

    showConfirmation(message: string)
    {
        return confirm(message);
    }

    loadValue(key: string, callback: (value: any) => void)
    {
        chrome.storage.sync.get(key, obj =>
        {
            var value;
            if (obj)
            {
                value = obj[key];
            }
            callback(value);
        });
    }

    saveValue(key: string, value: any)
    {
        var obj = {};
        obj[key] = value;
        chrome.storage.sync.set(obj);
    }

    showLoginDialog()
    {
        chrome.windows.getLastFocused(window =>
        {
            var width = 450;
            var height = 540;
            var left = 400;
            var top = 300;

            if (window.left != null && window.width != null)
            {
                left = Math.round(window.left + (window.width - width) / 2);
            }
            if (window.top != null && window.height != null)
            {
                top = Math.round(window.top + (window.height - height) / 2);
            }

            chrome.windows.create(<chrome.windows.CreateData>{
                left,
                top,
                width,
                height,
                focused: true,
                url: this.url + 'Account/Login',
                type: 'popup'
            }, window =>
                {
                    this.loginWinId = window.id;
                    this.loginTabId = window.tabs[0].id;
                });
        });
    }

    setButtonIcon(icon: string, tooltip: string)
    {
        chrome.browserAction.setIcon({
            path: {
                '19': 'images/chrome/' + icon + '19.png',
                '38': 'images/chrome/' + icon + '38.png'
            }
        });
        chrome.browserAction.setTitle({ title: tooltip });
    }
}

new ChromeExtension();