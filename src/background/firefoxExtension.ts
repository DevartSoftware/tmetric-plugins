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
        this.getActiveTabId().then(id => {

            this.sendToTabs({
                action: 'error',
                data: { message: message }
            }, id);
        });
    }
}

new FirefoxExtension();