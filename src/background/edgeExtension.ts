class EdgeExtension extends ExtensionBase {

    constructor() {
        super();
    }

    /** @override */
    getBrowserSchema(): string {
        return 'ms-browser-extension';
    }

    /** @override */
    getExtensionUUID() {
        return chrome.runtime.id;
    }

    /** @override */
    showNotification(message: string, title?: string) {
        // Notifications are not supported:
        // https://docs.microsoft.com/en-us/microsoft-edge/extensions/api-support/extension-api-roadmap
    }
}

new EdgeExtension();