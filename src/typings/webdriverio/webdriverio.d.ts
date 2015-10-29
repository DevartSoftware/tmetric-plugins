declare module PromisesAPlus {
    interface Thenable<T> {
        addCommand(coomandName: string, command: (...args: any[]) => any);
        url: (url?: string) => Thenable<{ value: string }>;
        waitForVisible: (selector: string, timeout?: number, reverse?: boolean) => Thenable<any>;
        waitForExist: (selector: string, timeout?: number, reverse?: boolean) => Thenable<any>;
        waitUrl: (url: string) => Thenable<any>;
        isVisible: (selector: string) => Thenable<boolean>;
        setValue: (selector: string, value: string) => Thenable<any>;
        login: (serviceName: string) => Thenable<any>;
        click: (selector: string) => Thenable<any>;
        getText: (selector: string) => Thenable<string>;
        getAttribute: (selector: string, attrName: string) => Thenable<string>;
        waitUntil(condition: () => Thenable<any>, timeout?: number): Thenable<any>;
        waitForClick: (selector: string, timeout?: number) => Thenable<any>;
        isExisting: (...args: any[]) => Thenable<any>;
        stopRunningTask: () => Thenable<any>;
        deleteCookie: () => Thenable<any>;
        getTabIds: () => Thenable<string[]>;
        switchTab(id: string): () => Thenable<any>;
        startAndTestTaskStarted(testProjectName: string, testIssueName: string, testIssueUrl: string): () => Thenable<any>;
        startStopAndTestTaskStopped(): () => Thenable<any>;
        keys: Chai.PromisedKeys;
        pause: (ms: number) => Thenable<any>;
    }
}

declare var browser: PromisesAPlus.Thenable<any>;

declare var require: (moduleName: string) => any;

declare var expect: (value: any) => Chai.Assertion;