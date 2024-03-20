class ChromeExtension extends ExtensionBase {

    constructor() {
        super('chrome-extension', browser.runtime.id);
        void this.injectVersionScript();
    }
}

new ChromeExtension();
