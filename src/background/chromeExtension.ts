class ChromeExtension extends ExtensionBase {

    constructor() {
        super(backgroundPort);
    }

    /**
     * @override
     * @param sender
     */
    isPopupRequest(sender: chrome.runtime.MessageSender) {
        return !!sender.url && !!sender.url.match(/^chrome.+popup.html$/);
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

new ChromeExtension();