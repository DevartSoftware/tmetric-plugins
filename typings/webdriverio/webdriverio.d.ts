/// <reference path="../q/Q.d.ts" />

declare module Q {
	interface IPromise<T> {
		url: (() => IPromise<string>) | ((url: string) => IPromise<any>);
		waitForVisible: (selector: string) => IPromise<any>;
		waitForExist: (selector: string) => IPromise<any>;
		isVisible: (selector: string) => IPromise<boolean>;
		setValue: (selector: string, value: string) => IPromise<any>;
		login: (serviceName: string) => IPromise<any>;
		click: (selector: string) => IPromise<any>;
		getText: (selector: string) => IPromise<string>;
		getAttribute: (selector: string, attrName: string) => IPromise<string>;
	}
}

declare var browser: Q.IPromise<any>;