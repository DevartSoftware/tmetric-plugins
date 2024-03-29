class SafariExtension extends ExtensionBase {

    constructor() {
        super('safari-web-extension', globalThis.location.host, true);
        void this.injectVersionScript();
    }
}

new SafariExtension();
