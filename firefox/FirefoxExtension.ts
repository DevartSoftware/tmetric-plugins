/// <reference path="../typings/firefox/firefox" />
/// <reference path="../extension-base/ExtensionBase" />

import buttons = require('sdk/ui/button/action');
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

var windowWatcher = chrome.Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(chrome.Ci.nsIWindowWatcher);
var alertsService = chrome.Cc['@mozilla.org/alerts-service;1'].getService(chrome.Ci.nsIAlertsService);
var promptService = chrome.Cc['@mozilla.org/embedcomp/prompt-service;1'].getService(chrome.Ci.nsIPromptService);

class FirefoxExtension extends ExtensionBase {
    loginWindow: Window;

    loginTabId: string;

    loginWindowPending: boolean;

    checkCloseTimeout: number;

    actionButton: Firefox.ActionButton;

    windowObserver: Firefox.nsIObserver;

    attachedTabs = <{ [tabId: string]: Firefox.Worker }>{};

    constructor() {
        super(
            prefs.prefs['server'],
            pageWorker.Page({
                contentScriptWhen: 'ready',
                contentScriptFile: [
                    './jquery.min.js',
                    './jquery.signalr.min.js',
                    './SignalRConnection.js'
                ],
            }).port);

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
            './utils.js',
            './IntegrationService.js',
            './Redmine.js',
            './Jira.js',
            './JiraAgile.js',
            './page.js'
        ];

        var contentStyle = style.Style({
            uri: './timer-link.css'
        });

        var attachTab = (tab: Firefox.Tab) => {
            if (tab.id == this.loginTabId) {
                return; // Do not attach to login dialog
            }

            contentMod.attach(contentStyle, tab);

            var worker = tab.attach(<Firefox.TabOptions>{
                contentScriptFile,
                onMessage: (message: ITabMessage) => {
                    this.onTabMessage(message, worker.tab.id, worker.tab == this.getActiveTab());
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
                        this.connect();
                    }
                }
            }
        }
        windowWatcher.registerNotification(this.windowObserver);

        this.actionButton = buttons.ActionButton({
            id: 'startButton',
            label: 'Devart Time Tracker',
            icon: this.getIconSet('inactive'),
            onClick: () => {
                var tab = this.getActiveTab();

                if (this.loginWindow != null) {
                    this.loginWindow.focus();
                }
                else {
                    var window = utils.getMostRecentBrowserWindow();
                    if (window && window.document) {
                        this.startTimer(tab.url, tab.title);
                    }
                }
            }
        });

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
        alertsService.showAlertNotification(self.data.url('icon.png'), title || 'Devart Time Tracker', message);
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

        var width = 450;
        var height = 475;
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

        var folder = '/'; // Pass folder in ReturnUrl (#60008)
        var folderIndex = this.url.indexOf('/', 10);
        if (folderIndex > 0) {
            folder = this.url.substring(folderIndex);
        }

        var url = this.url + 'Account/Login?ReturnUrl=' + folder + '%23/noapp';

        // wait for login window and tab identifiers
        this.loginWindowPending = true;

        try {
            var popupWindow = window.open(url, 'LoginWindow', parameters);
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
            '16': './' + icon + '16.png',
            '32': './' + icon + '32.png',
            '64': './' + icon + '64.png'
        };
    }

    openPage(url: string) {
        var window = windows.browserWindows.activeWindow;
        if (window != null) {
            var tab = this.getActiveTab();
            if (tab && tab.url == url) {
                return;
            }
            for (var i = window.tabs.length - 1; i >= 0; i--) {
                if (window.tabs[i].url == url) {
                    window.tabs[i].activate();
                    return;
                }
            }
        }
        tabs.open(<Firefox.TabOpenOptions>{ url })
    }
}

var extension: FirefoxExtension;

export function main() {
    extension = new FirefoxExtension();
}

export function onUnload() {
    extension.dispose();
}