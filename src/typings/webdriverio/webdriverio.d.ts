declare module PromisesAPlus {
    interface Thenable<T> {
        url: (url?: string) => Q.IPromise<{ value: string }>;
        waitForVisible: (selector: string, timeout?: number, flag?: boolean) => Q.IPromise<any>;
        waitForExist: (selector: string, timeout?: number, flag?: boolean) => Q.IPromise<any>;
        waitUrl: (url: string) => Q.IPromise<any>;
        isVisible: (selector: string) => Q.IPromise<boolean>;
        setValue: (selector: string, value: string) => Q.IPromise<any>;
        login: (serviceName: string) => Q.IPromise<any>;
        click: (selector: string) => Q.IPromise<any>;
        getText: (selector: string) => Q.IPromise<string>;
        getAttribute: (selector: string, attrName: string) => Q.IPromise<string>;
        addCommand(coomandName: string, command: (...args: any[]) => any);
        waitUntil(condition: () => Q.IPromise<any>, timeout?: number): Q.IPromise<any>;
        waitForClick: (selector: string, timeout?: number) => Q.IPromise<any>;
        isExisting: (...args: any[]) => Q.IPromise<any>;
        stopRunningTask: () => Q.IPromise<any>;
        deleteCookie: () => Q.IPromise<any>;
        getTabIds: () => Q.IPromise<any[]>;
        switchTab(id: any): () => Q.IPromise<any>;
        startAndTestTaskStarted(testProjectName: string, testIssueName: string, testIssueUrl: string): () => Q.IPromise<any>;
        startStopAndTestTaskStopped(): () => Q.IPromise<any>;
        keys: Chai.PromisedKeys;
        pause: (ms: number) => Q.IPromise<any>;
    }

}

declare module Q {
    interface IPromise<T> extends PromisesAPlus.Thenable<T> {
    }
}

declare var browser: Q.IPromise<any>;

declare var require: (moduleName: string) => any;

declare var expect: (value: any) => Chai.Assertion;