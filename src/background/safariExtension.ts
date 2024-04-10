class SafariExtension extends ExtensionBase {

    protected override readonly _noOffers = true;

    constructor() {
        super('safari-web-extension', globalThis.location.host, true);
        void this.injectVersionScript();
    }
}

new SafariExtension();
