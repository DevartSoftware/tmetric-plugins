class FirefoxExtension extends ExtensionBase {

    constructor() {
        super();

        this.sendToTabs({ action: 'initPage' });
    }

    /** @override */
    getBrowserSchema(): string {
        return 'moz-extension';
    }

    /** @override */
    getExtensionUUID() {
        return window.location.host;
    }

    /**
     * @override
     * @param message
     */
    protected showError(message: string) {
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Chrome_incompatibilities#Additional_incompatibilities
        this.getActiveTabId().then(id => {
            if (id) {
                this.sendToTabs({
                    action: 'error',
                    data: { message }
                }, id);
            }
        });
    }
}

new FirefoxExtension();