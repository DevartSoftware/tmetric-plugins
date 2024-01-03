class FirefoxExtension extends ExtensionBase {

    constructor(testValues: TestValues) {
        super(testValues);

        this.sendToTabs({ action: 'initPage' });
    }

    override getBrowserSchema(): string {
        return 'moz-extension';
    }

    override getExtensionUUID() {
        return window.location.host;
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

getTestValues().then(x => new FirefoxExtension(x));