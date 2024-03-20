class SafariExtension extends ExtensionBase {

    constructor() {
        super('safari-web-extension', globalThis.location.host);
        void this.injectVersionScript();
    }
}

new SafariExtension();
