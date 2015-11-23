declare module PromisesAPlus {
    interface Thenable<T> {
        addCommand(coomandName: string, command: (...args: any[]) => any);
        click: (selector: string) => Thenable<any>;
        close: (handle?: string) => Thenable<any>;
        closeTaskTrackerWindow: () => Thenable<any>;
        debug: () => Thenable<any>;
        deleteCookie: () => Thenable<any>;
        element: (selector: string) => Thenable<any>;
        execute: (script: string | Function, ...args: any[]) => Thenable<any>;
        isExisting: (...args: any[]) => Thenable<any>;
        isVisible: (selector: string) => Thenable<boolean>;
        getCurrentTabId: () => Thenable<string[]>;
        getTabIds: () => Thenable<string[]>;
        getText: (selector: string) => Thenable<string>;
        getTitle: () => Thenable<string>;
        getAttribute: (selector: string, attrName: string) => Thenable<string>;
        keys: Chai.PromisedKeys;
        login: (serviceName: string) => Thenable<any>;
        loginTimeTracker: () => Thenable<any>;
        loginTimeTrackerThroughExtension: () => Thenable<any>;
        logoutTimeTracker: () => Thenable<any>;
        newWindow: (url: string, windowName?: string, windowFeatures?: string) => Thenable<any>;
        openTaskTrackerWindow: () => Thenable<any>;
        pause: (ms: number) => Thenable<any>;
        refresh: () => Thenable<any>;
        setValue: (selector: string, value: string) => Thenable<any>;
        startAndTestTaskStarted(testProjectName: string, testIssueName: string, testIssueUrl: string): () => Thenable<any>;
        startStopAndTestTaskStopped(): () => Thenable<any>;
        stopRunningTask: () => Thenable<any>;
        switchTab: (id?: string) => Thenable<any>;
        switchToTaskTrackerWindow: () => Thenable<any>;
        switchToTimeTrackerWindow: () => Thenable<any>;
        url: (url?: string) => Thenable<{ value: string }>;
        waitForClick: (selector: string, timeout?: number) => Thenable<any>;
        waitForExist: (selector: string, timeout?: number, reverse?: boolean) => Thenable<any>;
        waitForRerender: (selector: string, timeout?: number) => Thenable<any>;
        waitForVisible: (selector: string, timeout?: number, reverse?: boolean) => Thenable<any>;
        waitUntil(condition: () => Thenable<any>, timeout?: number): Thenable<any>;
        waitUrl: (url: string) => Thenable<any>;
        window: (handle?: string) => Thenable<any>;
        windowHandle: () => Thenable<any>;
        windowHandles: () => Thenable<any>;
    }
}

declare var browser: PromisesAPlus.Thenable<any>;

declare var require: (moduleName: string) => any;

declare var expect: (value: any) => Chai.Assertion;