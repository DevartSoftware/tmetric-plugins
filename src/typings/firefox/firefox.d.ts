declare module Firefox {

    interface ButtonDescriptor {
        id: string;
        label: string;
        icon: string | IconSet;
        onClick: (state: any) => void;
    }

    interface ActionButton {
        click(): void;
        state(target: "tab", state?: any): any;
        state(target: "window", state?: any): any;
        state(target: string | BrowserWindow | Tab, state?: any): any;
        on(method: string, handler: (...args: any[]) => void): void;
        once(method: string, handler: (...args: any[]) => void): void;
        removeListener(method: string, handler: (...args: any[]) => void): void;
        destroy(): void;
        id: number;
        label: string;
        icon: IconSet | string;
        disabled: boolean;
    }

    interface ToggleButton extends ActionButton {
        checked: boolean;
    }

    interface IconSet {
        [size: string]: string;
    }

    interface TabOpenOptions {
        url: string;
        isPrivate?: boolean;
        inNewWindow?: boolean;
        inBackground?: boolean;
        isPinned?: boolean;
        onOpen?: TabCallback;
        onClose?: TabCallback;
        onReady?: TabCallback;
        onLoad?: TabCallback;
        onPageShow?: TabCallback;
        onActivate?: TabCallback;
        onDeactivate?: TabCallback;
    }

    interface Port {
        emit(method: string, ...args: any[]): void;
        on(method: string, handler: (...args: any[]) => void): void;
        once(method: string, handler: (...args: any[]) => void): void;
        removeListener(method: string, handler: (...args: any[]) => void): void;
    }

    interface WindowOpenOptions {
        url: string;
        isPrivate?: boolean;
        onOpen?: Function;
        onClose?: Function;
        onActivate?: Function;
        onDeactivate?: Function;
    }

    interface TabOptions {
        contentScriptFile?: string | string[];
        contentScript?: string | string[];
        contentScriptOptions?: any;
        onMessage?: Function;
        onError?: Function;
    }

    interface OpenDialogOptions {
        url: string;
        name?: string;
        features?: string;
        args?: any;
    }

    interface PageModOptions {
        include: string | RegExp | string[] | RegExp[];
        exclude?: string | RegExp | string[] | RegExp[];
        contentScriptFile?: string | string[];
        contentScript?: string | string[];
        contentScriptWhen?: string;
        contentScriptOptions?: any;
        contentStyleFile?: string | string[];
        contentStyle?: string | string[];
        attachTo?: string | string[];
        onAttach?: (worker: Worker) => void;
    }

    interface HiddenFrameOptions {
        onReady: Function;
    }

    interface Worker {
        postMessage(data: any): void;
        destroy(): void;
        port: Port;
        url: string;
        tab: Tab;
        on(eventName: string, handler: Function): void;
    }

    interface PageWorkerOptions {
        contentURL?: string;
        allow?: { script: boolean };
        include?: string | RegExp | string[] | RegExp[];
        contentScriptFile?: string | string[];
        contentScript?: string | string[];
        contentScriptWhen?: string;
        contentScriptOptions?: any;
        onMessage?: Function;
    }

    interface HiddenFrame {
        element: HTMLFrameElement;
        on(eventName: 'ready', handler: HiddenFrameCallback);
        on(eventName: string, handler: HiddenFrameCallback);
    }

    interface PageMod {
        destroy();
        include: (string | RegExp)[];
        on(eventName: 'attach', handler: Function);
        on(eventName: 'error', handler: Function);
        on(eventName: string, handler: Function);
    }

    interface Tab {
        pin();
        unpin();
        close(callback: Function);
        reload();
        activate();
        getThumbnail(): string;
        attach(options: TabOptions): Worker;
        id: string;
        title: string;
        url: string;
        favicon: string;
        index: number;
        isPinned: boolean;
        window: any;
        readyState: string;
        on(eventName: 'close', handler: TabCallback);
        on(eventName: 'ready', handler: TabCallback);
        on(eventName: 'load', handler: TabCallback);
        on(eventName: 'pageshow', handler: TabCallback);
        on(eventName: 'activate', handler: TabCallback);
        on(eventName: 'deactivate', handler: TabCallback);
        on(eventName: string, handler: TabCallback);
    }

    interface BrowserWindows extends Array<BrowserWindow> {
        activeWindow: BrowserWindow;
        open(options: string | WindowOpenOptions): BrowserWindow;

        on(eventName: 'open', handler: BrowserWindowCallback);
        on(eventName: 'close', handler: BrowserWindowCallback);
        on(eventName: 'ready', handler: BrowserWindowCallback);
        on(eventName: 'activate', handler: BrowserWindowCallback);
        on(eventName: 'deactivate', handler: BrowserWindowCallback);
        on(eventName: string, handler: BrowserWindowCallback);
    }

    interface BrowserWindow {
        activate();
        close(callback: Function);
        title: string;
        tabs: Tabs;
    }

    interface Tabs {
        [index: number]: Tab;
        activeTab: Firefox.Tab;
        length: number;
        open(options: string | Firefox.TabOpenOptions): any;
        on(eventName: string, handler: Firefox.TabCallback): void;
    }

    interface SelfData {
        load(name: string): string;
        url(name: string): string;
    }

    interface Page {
        destroy();
        postMessage(message: Object);
        port: Port;
    }

    interface PanelOptions {
        width?: number;
        height?: number;
        position?: ToggleButton | PanelPosition;
        focus?: boolean;
        allow?: { script: boolean },
        contentURL?: string;
        contentScriptFile?: string | string[];
        contentScript?: string | string[];
        contentScriptWhen?: string; // "start" | "ready" | "end"
        contentScriptOptions?: Object;
        contentStyleFile?: string | string[];
        contentStyle?: string | string[];
        contextMenu?: boolean;
        onMessage?: Function;
        onShow?: Function;
        onHide?: Function;
        onError?: Function;
    }

    interface Panel {
        destroy();
        postMessage(message: Object);
        show(options: PanelOptions);
        hide();
        resize(width: number, height: number);
        on(type: string, listener: Function);
        on(type: 'show', listener: () => void);
        on(type: 'hide', listener: () => void);
        on(type: 'message', listener: (value: Object) => void);
        on(type: 'error', listener: (value: Error) => void);
        removeListener(type: string, listener: Function);
        port: Port;
        isShowing: boolean;
        height: number;
        width: number;
        focus: boolean;
        contentURL?: string;
        contentScriptFile?: string | string[];
        contentScript?: string | string[];
        contentScriptWhen?: string;
        contentScriptOptions?: Object;
    }

    interface PanelPosition {
        top: number;
        right: number;
        bottom: number;
        left: number;
    }

    interface Modification {
    }

    interface Style extends Modification {
        source: string[];
        uri: string[];
        type: string;
    }

    interface StyleOptions {
        uri?: string | string[];
        source?: string | string[];
        type?: string;
    }

    interface nsIWindowWatcher {
        registerNotification(aObserver: nsIObserver);
        unregisterNotification(aObserver: nsIObserver);
    }

    interface nsIPromptService {
        alert(aParent: Window, aDialogTitle: string, aText: string);
        confirm(aParent: Window, aDialogTitle: string, aText: string): boolean;
    }

    interface nsIIdleService {
        addIdleObserver(aObserver: nsIObserver);
        removeIdleObserver(aObserver: nsIObserver);
        idleTime: number;
    }

    interface nsIAlertsService {
        showAlertNotification(
            imageUrl: string,
            title: string,
            text: string,
            textClickable?: boolean,
            cookie?: string,
            alertListener?: any,
            name?: string,
            dir?: string,
            lang?: string)
    }

    interface nsIObserver {
        observe(aSubject: nsISupports, aTopic: string, aData: any);
    }

    interface ServiceInterface<T> {
    }

    interface nsISupports {
        QueryInterface<T>(name: ServiceInterface<T>): T;
    }

    interface ServiceInterfaces {
        nsIWindowWatcher: ServiceInterface<nsIWindowWatcher>;
        nsIDOMWindow: ServiceInterface<Window>;
        nsIAlertsService: ServiceInterface<nsIAlertsService>;
        nsIPromptService: ServiceInterface<nsIPromptService>;
        nsIIdleService: ServiceInterface<nsIIdleService>;
    }

    type BrowserWindowCallback = (window: BrowserWindow) => void

    type WorkerCallback = (window: Worker) => void

    type HiddenFrameCallback = (frame: HiddenFrame) => void

    type TabCallback = (tab: Firefox.Tab) => void
}

declare module 'sdk/ui/button/action'
{
    function ActionButton(descriptor: Firefox.ButtonDescriptor): Firefox.ActionButton;
}

declare module 'sdk/ui/button/toggle'
{
    function ToggleButton(descriptor: Firefox.ButtonDescriptor): Firefox.ToggleButton;
}

declare module 'sdk/panel' {
    function Panel(options: Firefox.PanelOptions): Firefox.Panel;
}

declare module 'sdk/tabs'
{
    var tabs: Firefox.Tabs;
    export = tabs;
}

declare module 'sdk/view/core'
{
    interface ViewCore {
        setAttribute(name: string, value: any): void;
    }

    function viewFor(window: Firefox.BrowserWindow): Window;
    function getActiveView(panel: Firefox.Panel): ViewCore;
}

declare module 'sdk/window/utils'
{
    function getMostRecentBrowserWindow(): Window;
    function getFocusedWindow(): Window;
    function openDialog(options: Firefox.OpenDialogOptions): Window;
    function open(uri: string): Window;
}

declare module 'sdk/windows'
{
    var browserWindows: Firefox.BrowserWindows
}

declare module 'chrome'
{
    var Cc: {
        [lib: string]: { getService<T>(service: Firefox.ServiceInterface<T>): T }
    }

    var Ci: Firefox.ServiceInterfaces;
}

declare module 'sdk/timers'
{
    function setTimeout(handler: any, timeout?: any, ...args: any[]): number;
    function clearTimeout(handle: number): void;
    function setInterval(handler: any, timeout?: any, ...args: any[]): number;
    function clearInterval(handle: number): void;
}

declare module 'sdk/self'
{
    var uri: string;
    var id: string;
    var name: string;
    var version: string;
    var loadReason: string;
    var isPrivateBrowsingSupported: boolean;
    var data: Firefox.SelfData;
    function on(eventName: string, handler: Function): void;
}

declare module 'sdk/page-mod'
{
    function PageMod(options: Firefox.PageModOptions): Firefox.PageMod;
}

declare module 'sdk/net/xhr'
{
    var XMLHttpRequest: any;
}

declare module 'sdk/frame/hidden-frame'
{
    function HiddenFrame(options: Firefox.HiddenFrameOptions): Firefox.HiddenFrame;
    function add(hiddenFrame: Firefox.HiddenFrame);
    function remove(hiddenFrame: Firefox.HiddenFrame);
}

declare module 'sdk/page-worker' {
    function Page(options: Firefox.PageWorkerOptions): Firefox.Page;
}

declare module 'sdk/simple-prefs' {
    var prefs: { [prefName: string]: any };
}

declare module 'sdk/preferences/service' {
    function set(name: string, value: string | number | boolean);
    function get(name: string, defaultValue?: string | number | boolean): string | number | boolean;
    function has(name: string): boolean;
    function keys(root: string): string[];
    function isSet(name: string): boolean;
    function reset(name: string);
    function getLocalized(name: string, defaultValue?: string): string;
    function setLocalized(name: string, value: string);
}

declare module 'sdk/simple-storage' {
    var storage: {};
}

declare module 'sdk/stylesheet/style' {
    function Style(options: Firefox.StyleOptions): Firefox.Style;
}

declare module 'sdk/content/mod' {
    function attachTo(modification: Firefox.Modification, window: Window): void;
    function detachFrom(modification: Firefox.Modification, window: Window): void;
    function getTargetWindow(target: Firefox.Tab): Window;
    function attach(modification: Firefox.Modification, target: Firefox.Tab): void;
    function detach(modification: Firefox.Modification, target: Firefox.Tab): void;
}

declare module 'sdk/tabs/utils' {
    function activateTab(tab: Firefox.Tab, window: Firefox.BrowserWindow);
    function getTabBrowser(window: Firefox.BrowserWindow): Object;
    function getTabContainer(window: Firefox.BrowserWindow): Object;
    function getTabs(window?: Firefox.BrowserWindow): Firefox.Tab[];
    function getActiveTab(window?: Firefox.BrowserWindow): Firefox.Tab;
    function getOwnerWindow(tab: Firefox.Tab): Firefox.BrowserWindow;
    function openTab(window, url, options?: { inBackground: boolean, pinned: boolean }): Firefox.Tab;
    function isTabOpen(tab): boolean;
    function closeTab(tab: Firefox.Tab);
    function getURI(tab: Firefox.Tab): string;
    function getTabBrowserForTab(tab: Firefox.Tab): Object;
    function getBrowserForTab(tab: Firefox.Tab): ObjectURLOptions;
    function getTabId(tab: Firefox.Tab): any;
    function getTabForId(id: any): Firefox.Tab;
    function getTabTitle(tab: Firefox.Tab): string;
    function setTabTitle(tab: Firefox.Tab, title: string)
    function getTabContentWindow(tab: Firefox.Tab): Object;
    function getAllTabContentWindows(): Object[];
    function getTabForContentWindow(window: Object);
    function getTabURL(tab: Firefox.Tab)
    function setTabURL(tab: Firefox.Tab, url)
    function getTabContentType(tab: Firefox.Tab)
    function getSelectedTab(window: Object)
    function getTabForBrowser(browser: Object)
}

interface Window {
    port: Firefox.Port;
    postMessage(message: any, targetOrigin?: string, ports?: any): void;
    on(eventName: string, handler: Function);
}