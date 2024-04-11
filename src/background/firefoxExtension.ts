class FirefoxExtension extends ExtensionBase {

    constructor() {
        super('moz-extension', globalThis.location.host);
        this.sendToTabs({ action: 'initPage' });
    }
}

new FirefoxExtension();
