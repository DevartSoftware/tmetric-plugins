class EdgeExtension extends ExtensionBase {

    constructor() {
        super(backgroundPort);
    }

    /**
    * @override
    * @param message
    */
    showError(message: string) {
        // This needed to prevent alert cleaning via build.
        var a = alert;
        a(message);
    }

    /**
     * @override
     * @param sender
     */
    isPopupRequest(sender: chrome.runtime.MessageSender) {
        return !!sender.id;
    }

    /**
     * Show push notification (Does not support through web extension by Edge right now)
     * @override
     * @param message
     * @param title
     */
    showNotification(message: string, title?: string) {

        this.getActiveTabId().then(id => {
            title = title || 'TMetric';
            let iconUrl = 'images/icon80.png';

            this.sendToTabs({
                action: 'notify',
                data: {
                    message: message,
                    title: title,
                    icon: iconUrl
                }
            }, id);
        });
    }

    /**
     * @override
     * @param message
     */
    showConfirmation(message: string) {
        return confirm(message);
    }

    /**
     * Create popup window
     * @override
     * @param width
     * @param height
     * @param left
     * @param top
     */
    createPopupWindow(width: number, height: number, left: number, top: number) {
        chrome.windows.create(<chrome.windows.CreateData>{
            left,
            top,
            width,
            height,
            focused: true,
            url: this.getLoginUrl(),
            type: 'popup'
        }, popupWindow => {

            var popupTab = popupWindow.tabs[0];

            this.loginWinId = popupWindow.id;
            this.loginTabId = popupTab.id;
            this.loginWindowPending = false;
        });
    }
}

new EdgeExtension();