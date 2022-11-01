class FirefoxExtension extends ExtensionBase {

    constructor() {
        super('moz-extension', window.location.host);

        this.sendToTabs({ action: 'initPage' });
    }

    /**
     * @param message
     */
    protected override showError(message: string) {
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

new FirefoxExtension()