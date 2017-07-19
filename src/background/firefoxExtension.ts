class FirefoxExtension extends ExtensionBase {

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
     * @param message
     */
    showConfirmation(message: string) {
        return confirm(message);
    }

    /**
     * @override
     * @param sender
     */
    isPopupRequest(sender: chrome.runtime.MessageSender) {
        return !!(sender.url && sender.url.match(/^moz-extension:\/\/.+popup.html/));
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
            url: this.getLoginUrl(),
            type: 'popup'
        }, popupWindow => {

            var popupTab = popupWindow.tabs[0];

            this.loginWinId = popupWindow.id;
            this.loginTabId = popupTab.id;
            this.loginWindowPending = false;

            var deltaWidth = width - popupTab.width;
            var deltaHeight = height - popupTab.height;

            chrome.windows.update(popupWindow.id, <chrome.windows.UpdateInfo>{
                left: left - Math.round(deltaWidth / 2),
                top: top - Math.round(deltaHeight / 2),
                width: width + deltaWidth,
                height: height + deltaHeight
            });
        });
    }
}

new FirefoxExtension();