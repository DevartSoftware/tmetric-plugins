// https://developer.apple.com/documentation/safariextensions

interface SafariApplication extends SafariEventTarget {
    activeBrowserWindow: SafariBrowserWindow;
    browserWindows: SafariBrowserWindow[];
    openBrowserWindow(): SafariBrowserWindow;
}

interface SafariBrowserWindow extends SafariEventTarget {
    tabs: SafariBrowserTab[];
    activeTab: SafariBrowserTab;
    visible: boolean;
    activate();
    close();
    openTab(visibility: string, index?: number): SafariBrowserTab;
    insertTab(tab: SafariBrowserTab, index: number);
}

interface SafariBrowserTab extends SafariEventTarget {
    browserWindow: SafariBrowserWindow;
    private: boolean;
    reader: any;
    title: string;
    page: SafariWebPageProxy;
    url: string;
    activate();
    close();
    visibleContentsAsDataURL(callback: (base64image: string) => void);
}

interface SafariExtension {
    globalPage: SafariExtensionGlobalPage;
    bars: SafariExtensionBar[]
    baseURI: string;
    toolbarItems: SafariExtensionToolbarItem[];
    companion: SafariExtensionCompanion;
    menus: SafariExtensionMenu[];
    popovers: SafariExtensionPopover[];
    displayVersion: string;
    bundleVersion: string;
    settings: SafariExtensionSettings;
    secureSettings: SafariExtensionSecureSettings;
    createMenu(identifier: string): SafariExtensionMenu;
    removeMenu(identifier: string);
    createPopover(identifier: string, url: string, width: number, height: number): SafariExtensionPopover;
    removePopover(identifier: string);
    addContentScript(source: string, whitelist: string[], blacklist: string[], runAtEnd: boolean);
    addContentScriptFromURL(url: string, whitelist: string[], blacklist: string[], runAtEnd: boolean): string;
    addContentStyleSheet(source: string, whitelist: string[], blacklist: string[]): string;
    addContentStyleSheetFromURL(url: string, whitelist: string[], blacklist: string[]): string;
    removeContentScript(url: string);
    removeContentScripts();
    removeContentStyleSheet(url: string);
    removeContentStyleSheets();
    setContentBlocker(contentBlocker: any, callback: () => void);
}

interface SafariExtensionPopover extends SafariEventTarget {
    identifier: string;
    visible: boolean;
    contentWindow: Window;
    height: number;
    width: number;
    hide();
}

interface SafariExtensionToolbarItem extends SafariEventTarget {
    badge: number;
    image: string;
    label: string;
    paletteLabel: string;
    toolTip: string;
    menu: SafariExtensionMenu;
    popover: SafariExtensionPopover;
    browserWindow: SafariBrowserWindow;
    command: string;
    disabled: boolean;
    identifier: string;
    showMenu();
    showPopover();
    validate();
}

interface SafariExtensionMenu {
}

interface SafariExtensionCompanion extends SafariEventTarget, SafariDispatcher {
}

interface SafariExtensionSettings extends SafariEventTarget {
    getItem(key: string): any;
    setItem(key: string, value: any);
    removeItem(key: string);
    clear();
}

interface SafariExtensionSecureSettings extends SafariExtensionSettings {
}

interface SafariExtensionBar extends SafariEventTarget {
    visible: boolean;
    browserWindow: SafariBrowserWindow
    contentWindow: Window;
    identifier: string;
    label: string;
    hide(doNotRemember: boolean);
    show(doNotRemember: boolean);
}

interface SafariExtensionGlobalPage {
    contentWindow: Window;
}

interface SafariWebPageProxy {
    dispatchMessage(name: string, message: any): void;
}

interface SafariContentBrowserTabProxy extends SafariDispatcher {
    canLoad(event: Event, message: any);
    setContextMenuEventUserInfo(event: MouseEvent, userInfo: any);
}

interface SafariEvent {
    target: SafariEventTarget;
}

interface SafariMessage extends SafariEvent {
    name: string;
    message: any;
}

type SafariEventListener = (event: SafariEvent) => void;

interface SafariEventTarget {
    addEventListener(type: string, listener: SafariEventListener, useCapture: boolean): void;
    removeEventListener(type: string, listener: SafariEventListener, useCapture: boolean): void;
}

interface SafariContentWebPage extends SafariEventTarget, SafariDispatcher {
    tab: SafariContentBrowserTabProxy;
}

interface SafariDispatcher {
    dispatchMessage(name: string, message: any): void;
}

declare namespace safari {
    export var self: SafariContentWebPage;
    export var extension: SafariExtension;
    export var application: SafariApplication;
}