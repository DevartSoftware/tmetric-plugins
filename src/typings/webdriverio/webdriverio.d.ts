declare module PromisesAPlus {

    interface Thenable<T> {
        addCommand(coomandName: string, command: (...args: any[]) => any);
        click: (selector: string) => Thenable<any>;
        close: (handle?: string) => Thenable<any>;
        debug: () => Thenable<any>;
        deleteCookie: () => Thenable<any>;
        element: (selector: string) => Thenable<WebDriverIO.Result<WebDriverIO.WebElement>>;
        execute: (script: string | Function, ...args: any[]) => Thenable<any>;
        getAttribute: (selector: string, attrName: string) => Thenable<string>;
        getTabIds: () => Thenable<string[]>;
        getText: (selector: string) => Thenable<string>;
        getTitle: () => Thenable<string>;
        getValue: (selector: string) => Thenable<string>;
        isExisting: (...args: any[]) => Thenable<any>;
        isVisible: (selector: string) => Thenable<boolean>;
        keys: Chai.PromisedKeys;
        newWindow: (url: string, windowName?: string, windowFeatures?: string) => Thenable<any>;
        pause: (ms: number) => Thenable<any>;
        refresh: () => Thenable<any>;
        setValue: (selector: string, value: string) => Thenable<any>;
        url: (url?: string) => Thenable<WebDriverIO.Result<string>>;
        waitForExist: (selector: string, timeout?: number, reverse?: boolean) => Thenable<any>;
        waitForVisible: (selector: string, timeout?: number, reverse?: boolean) => Thenable<any>;
        waitUntil(condition: () => Thenable<any>, timeout?: number): Thenable<any>;
        window: (handle?: string) => Thenable<any>;
        windowHandle: () => Thenable<WebDriverIO.Result<string>>;
        windowHandles: () => Thenable<WebDriverIO.Result<string[]>>;
    }
}

declare module WebDriverIO {

    const enum StatusCode {
        Success = 0,
        NoSuchDriver = 6,
        NoSuchElement = 7,
        NoSuchFrame = 8,
        UnknownCommand = 9,
        StaleElementReference = 10,
        ElementNotVisible = 11,
        InvalidElementState = 12,
        UnknownError = 13,
        ElementIsNotSelectable = 15,
        JavaScriptError = 17,
        XPathLookupError = 19,
        Timeout = 21,
        NoSuchWindow = 23,
        InvalidCookieDomain = 24,
        UnableToSetCookie = 25,
        UnexpectedAlertOpen = 26,
        NoAlertOpenError = 27,
        ScriptTimeout = 28,
        InvalidElementCoordinates = 29,
        IMENotAvailable = 30,
        IMEEngineActivationFailed = 31,
        InvalidSelector = 32,
        SessionNotCreatedException = 33,
        MoveTargetOutOfBounds = 34
    }

    interface Result<T> {
        /**
         * An opaque handle used by the server to determine where to route session-specific commands. This ID
         * should be included in all future session-commands in place of the :sessionId path segment variable.
         */
        sessionId: string;

        /**
         * A status code summarizing the result of the command.A non- zero value indicates that the command failed.
         */
        status: StatusCode;

        /**
         * The response JSON value.
         */
        value: T;
    }

    interface WebElement {
        /**
         * The opaque ID assigned to the element by the server. This ID should
         * be used in all subsequent commands issued against the element.
         */
        ELEMENT: string;
    }
}

declare var browser: PromisesAPlus.Thenable<any>;

declare var require: (moduleName: string) => any;

declare var expect: (value: any) => Chai.Assertion;