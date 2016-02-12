import buttons = require('sdk/ui/button/toggle');
import panels = require("sdk/panel");
import tabs = require('sdk/tabs');
import windows = require('sdk/windows');
import utils = require('sdk/window/utils');
import chrome = require('chrome'); // it is not Chrome browser, see https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Chrome_Authority
import timers = require('sdk/timers');
import pageWorker = require('sdk/page-worker');
import self = require('sdk/self');
import prefs = require('sdk/simple-prefs');
import storage = require('sdk/simple-storage');
import style = require('sdk/stylesheet/style');
import contentMod = require('sdk/content/mod');
import pageMod = require("sdk/page-mod");
import core = require("sdk/view/core");

var windowWatcher = chrome.Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(chrome.Ci.nsIWindowWatcher);
var alertsService = chrome.Cc['@mozilla.org/alerts-service;1'].getService(chrome.Ci.nsIAlertsService);
var promptService = chrome.Cc['@mozilla.org/embedcomp/prompt-service;1'].getService(chrome.Ci.nsIPromptService);

class FirefoxExtension extends ExtensionBase {
    loginWindow: Window;

    loginTabId: string;

    loginWindowPending: boolean;

    checkCloseTimeout: number;

    actionButton: Firefox.ToggleButton;

    windowObserver: Firefox.nsIObserver;

    attachedTabs = <{ [tabId: string]: Firefox.Worker }>{};

    constructor() {
        super(
            pageWorker.Page({
                contentScriptWhen: 'ready',
                contentScriptFile: [
                    './lib/jquery.min.js',
                    './lib/jquery.signalr.min.js',
                    './background/signalRConnection.js'
                ],
            }).port);

        pageMod.PageMod({
            // https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/util_match-pattern
            include: ["*.alm-build", "*.localhost", "*.app.tmetric.com"],
            contentScriptWhen: "start",
            attachTo: ["existing", "top"],
            contentScriptFile: "./in-page-scripts/pageTalk.js"
        });

        pageMod.PageMod({
            include: ["http://*", "https://*"],
            contentScriptWhen: "ready",
            attachTo: ["existing", "top", "frame"],
            contentStyleFile: self.data.url("./css/timer-link.css")
        });

        tabs.on('close', tab => {
            if (this.checkCloseTimeout) {
                timers.clearTimeout(this.checkCloseTimeout);
            }

            this.checkCloseTimeout = timers.setTimeout(() => forEachLiveTab(), 60000);
        });

        var forEachLiveTab = (action?: (worker: Firefox.Worker) => void) => {
            this.checkCloseTimeout = null;
            var allUrls = <string[]>[];
            var allTabIds = {};
            for (var i in tabs) {
                allTabIds[tabs[i].id] = true;
                allUrls.push(tabs[i].url);
            }
            for (var i in this.attachedTabs) {
                if (!allTabIds[i]) {
                    delete this.attachedTabs[i];
                }
                else if (action) {
                    action(this.attachedTabs[i]);
                }
            }
            this.cleanUpTabInfo(allUrls);
        }

        this.sendToTabs = (message, tabId?) => {
            if (tabId != null) {
                var worker = this.attachedTabs[tabId];
                if (worker) {
                    worker.postMessage(message);
                }
            }
            else {
                forEachLiveTab(worker => worker.postMessage(message));
            }
        };

        var contentScriptFile = [
            './in-page-scripts/utils.js',
            './in-page-scripts/integrationService.js',
            './in-page-scripts/integrations/asana.js',
            './in-page-scripts/integrations/assembla.js',
            './in-page-scripts/integrations/axosoft.js',
            './in-page-scripts/integrations/basecamp.js',
            './in-page-scripts/integrations/bitbucket.js',
            './in-page-scripts/integrations/bugzilla.js',
            './in-page-scripts/integrations/gitHub.js',
            './in-page-scripts/integrations/gitLab.js',
            './in-page-scripts/integrations/jira.js',
            './in-page-scripts/integrations/pivotalTracker.js',
            './in-page-scripts/integrations/producteev.js',
            './in-page-scripts/integrations/redmine.js',
            './in-page-scripts/integrations/sprintly.js',
            './in-page-scripts/integrations/teamweek.js',
            './in-page-scripts/integrations/teamwork.js',
            './in-page-scripts/integrations/tfs.js',
            './in-page-scripts/integrations/trac.js',
            './in-page-scripts/integrations/trello.js',
            './in-page-scripts/integrations/waffle.js',
            './in-page-scripts/integrations/wrike.js',
            './in-page-scripts/integrations/youTrack.js',
            './in-page-scripts/page.js'
        ];

        var attachTab = (tab: Firefox.Tab) => {
            // worker.tab can be undefined for some unknown reason (#66666),
            // so remember id in variable
            var tabId = tab.id;

            if (tabId == this.loginTabId) {
                return; // Do not attach to login dialog
            }

            var worker = tab.attach(<Firefox.TabOptions>{
                contentScriptFile,
                onMessage: (message: ITabMessage) => {
                    var activeTab = this.getActiveTab();
                    this.onTabMessage(message, tabId, activeTab && activeTab.id == tabId);
                }
            });

            this.attachedTabs[tab.id] = worker;
        }

        // PageMod has bug (#59979), so use tabs API
        tabs.on('ready', tab => attachTab(tab));

        this.windowObserver = {
            observe: (subject, topic, data) => {
                if (this.loginWindow != null && topic == 'domwindowclosed') {
                    var closedWindow = subject.QueryInterface(chrome.Ci.nsIDOMWindow);

                    if (closedWindow == this.loginWindow) {
                        this.loginWindow = null;
                        this.reconnect();
                    }
                }
            }
        }
        windowWatcher.registerNotification(this.windowObserver);

        // addon toggle button

        this.actionButton = buttons.ToggleButton({
            id: 'startButton',
            label: 'TMetric',
            icon: this.getIconSet('inactive'),
            onClick: (state) => {
                if (state.checked) {
                    showPanel();
                }
            }
        });

        var showPanel = () => {

            // remember the window where extension button was pressed on
            var window = windows.browserWindows.activeWindow;

            var panel = panels.Panel({
                contentURL: "./popup/popup.html",
                contentScriptFile: [
                    "./lib/jquery.min.js",
                    "./lib/select2/select2.full.min.js",
                    "./popup/popupBase.js",
                    "./popup/firefoxPopup.js"
                ],
                onShow: () => {
                    panel.port.emit('popup_showed');
                },
                onHide: () => {
                    panel.port.emit('popup_hidden');
                    panel.destroy();
                    this.actionButton.state(window, { checked: false });
                }
            });

            panel.port.on('popup_request', (message: IPopupRequest) => {
                this.onPopupRequest(message, (response) => {
                    panel.port.emit('popup_request_' + message.action + '_response', response);
                });
            });

            panel.port.on('popup_resize', ({width, height}) => {
                if (panel.isShowing) {
                    panel.resize(width, height);
                } else {
                    panel.show({
                        position: this.actionButton,
                        width: width,
                        height: height
                    });
                }
            });

            panel.port.on('popup_close', () => {
                panel.hide();
            });

            // prevent popup auto hidding and handle it in popup
            core.getActiveView(panel).setAttribute("noautohide", true);
        };

        //

        var updateCurrentTab = (tab?: Firefox.Tab) => {
            if (this.loginWindowPending) {
                return;
            }

            var canReset = tab != null;

            tab = tab || this.getActiveTab();

            if (tab) {
                if (tab.id != this.loginTabId) {
                    this.setCurrentTab(tab.url, tab.title);
                }
            }
            else if (canReset) {
                this.setCurrentTab(null, null);
            }
        };

        tabs.on('activate', tab => {
            if (!this.attachedTabs[tab.id] && tab.url && tab.url.indexOf('http') == 0 &&
                (tab.readyState == "interactive" || tab.readyState == "complete")) {
                // Firefox does not attach to some tabs after browser session restore
                attachTab(tab);
            }

            updateCurrentTab(tab);
        });
        tabs.on('pageshow', () => updateCurrentTab());

        updateCurrentTab();

        // Update hint once per minute
        var setUpdateTimeout = () => timers.setTimeout(() => {
            this.updateState();
            setUpdateTimeout();
        }, (60 - new Date().getSeconds()) * 1000);
        setUpdateTimeout();
    }

    dispose() {
        if (this.windowObserver) {
            windowWatcher.unregisterNotification(this.windowObserver);
            this.windowObserver = null;
        }
        if (this.checkCloseTimeout) {
            timers.clearTimeout(this.checkCloseTimeout);
            this.checkCloseTimeout = null;
        }
    }

    showError(message: string) {
        promptService.alert(null, null, message);
    }

    showNotification(message: string, title?: string) {
        alertsService.showAlertNotification(self.data.url('../icon.png'), title || 'TMetric', message);
    }

    showConfirmation(message: string) {
        return promptService.confirm(null, null, message);
    }

    loadValue(key: string, callback: (value: any) => void) {
        callback(storage.storage[key]);
    }

    saveValue(key: string, value: any) {
        storage.storage[key] = value;
    }

    showLoginDialog() {
        if (this.loginWindow != null) {
            this.loginWindow.focus();
            return;
        }

        if (this.loginWindowPending) {
            return;
        }

        var window = utils.getMostRecentBrowserWindow();

        var width = 500;
        var height = 600;
        var left = 400;
        var top = 300;

        if (window.screenX != null && window.outerWidth != null) {
            left = window.screenX + (window.outerWidth - width) / 2;
        }
        if (window.screenY != null && window.outerHeight != null) {
            top = window.screenY + (window.outerHeight - height) / 2;
        }

        var parameters = 'location=' + 0 +
            ', menubar=' + 0 +
            ', width=' + width +
            ', height=' + height +
            ', toolbar=' + 0 +
            ', scrollbars=' + 0 +
            ', status=' + 0 +
            ', resizable=' + 1 +
            ', left=' + left +
            ', top=' + top;

        // wait for login window and tab identifiers
        this.loginWindowPending = true;

        try {
            var popupWindow = window.open(this.getLoginUrl(), 'LoginWindow', parameters);
            popupWindow.onfocus = () => {
                popupWindow.onfocus = null;

                // accessing firefox properties can trigger tab events, so do not reset pending flag before
                this.loginWindow = utils.getMostRecentBrowserWindow();
                this.loginTabId = this.getActiveTab().id;

                this.loginWindowPending = false;
            };
        }
        catch (e) {
            this.loginWindowPending = false;
            throw e;
        }
    }

    setButtonIcon(icon: string, tooltip: string) {
        this.actionButton.icon = this.getIconSet(icon);
        this.actionButton.label = tooltip;
    }

    getActiveTab(): Firefox.Tab {
        // Try to get tab from active widow  (https://bugzilla.mozilla.org/show_bug.cgi?id=942511)
        var window = windows.browserWindows.activeWindow;
        if (window != null) {
            return window.tabs.activeTab;
        }
        return tabs.activeTab;
    }

    getIconSet(icon: string): Firefox.IconSet {
        return {
            '16': './images/firefox/' + icon + '16.png',
            '32': './images/firefox/' + icon + '32.png',
            '64': './images/firefox/' + icon + '64.png'
        };
    }

    openPage(url: string) {

        var activeWindow = windows.browserWindows.activeWindow;
        var activeTabId = tabs.activeTab.id;
        var pageTabs = <Firefox.Tab[]>[];
        for (let index = 0, size = tabs.length; index < size; index++) {
            let tab = tabs[index];
            if (tab.url == url) {
                pageTabs.push(tab);
            }
        }

        if (pageTabs.length) {

            var anyWindowTab: Firefox.Tab, anyWindowActiveTab: Firefox.Tab, currentWindowTab: Firefox.Tab, currentWindowActiveTab: Firefox.Tab;
            for (let index = 0, size = pageTabs.length; index < size; index++) {
                anyWindowTab = pageTabs[index];
                if (anyWindowTab == anyWindowTab.window.tabs.activeTab) {
                    anyWindowActiveTab = anyWindowTab;
                }
                if (anyWindowTab.window == activeWindow) {
                    currentWindowTab = anyWindowTab;
                    if (currentWindowTab == currentWindowTab.window.tabs.activeTab) {
                        currentWindowActiveTab = currentWindowTab;
                    }
                }
            }

            var tabToActivate = currentWindowActiveTab || currentWindowTab || anyWindowActiveTab || anyWindowTab;
            tabToActivate.window.activate();
            tabToActivate.activate();
        } else {
            tabs.open(<Firefox.TabOpenOptions>{ url });
        }
    }
}

var extension: FirefoxExtension;

export function main() {
    extension = new FirefoxExtension();
}

export function onUnload() {
    extension.dispose();
}