class ChromeExtension extends ExtensionBase {

    constructor() {
        super();
    }

    /** @override */
    getBrowserSchema(): string {
        return 'chrome-extension';
    }

    /** @override */
    getExtensionUUID() {
        return chrome.runtime.id;
    }
}

new ChromeExtension();