class SafariExtension extends ExtensionBase {

    constructor() {
        super('safari-web-extension', globalThis.location.host);
        void this.injectVersionScript();
    }

    private _badgeTimeout: number | undefined;

    /**
     * Show push notification
     * @param message
     */
    protected override showNotification(message: string) {
        if (this._badgeTimeout) {
            clearTimeout(this._badgeTimeout);
            this._badgeTimeout = undefined;
        }
        this.setBadgeMessage(message);
        this._badgeTimeout = setTimeout(() => {
            this.setBadgeMessage(undefined);
            this._badgeTimeout = undefined;
        }, 10000);
    }
}

new SafariExtension();
