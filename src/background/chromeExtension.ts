class ChromeExtension extends ExtensionBase {

    constructor() {
        super();

        // Manualy inject content scripts on all tabs.
        chrome.runtime.getManifest().content_scripts.forEach(contentScripts => {

            let patternToRegExp = (matchPattern: string) => new RegExp('^' + matchPattern
                .replace(/[\-\/\\\^\$\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
                .replace(/\*/g, '.*'));
            let matches = contentScripts.matches.map(patternToRegExp);
            let excludeMatches = (contentScripts.exclude_matches || []).map(patternToRegExp);
            let jsFiles = contentScripts.js;
            let cssFiles = contentScripts.css;
            let runAt = contentScripts.run_at;

            chrome.tabs.query({}, tabs =>
                tabs.forEach(tab => {
                    let isMatched = (regexp: RegExp) => regexp.test(tab.url);
                    if (matches.some(isMatched) && !excludeMatches.some(isMatched)) {
                        jsFiles.forEach(file => chrome.tabs.executeScript(tab.id, { file, runAt }));
                        cssFiles.forEach(file => chrome.tabs.insertCSS(tab.id, { file }));
                    }
                }));
        });
    }

    /** @override */
    getBrowserSchema(): string {
        return 'chrome-extension';
    }

    /** @override */
    getExtensionUUID() {
        return chrome.runtime.id;
    }

    /**
     * @override
     * @param sender
     */
    isPopupRequest(sender: chrome.runtime.MessageSender) {
        return /^chrome-extension:.+popup.html/.test(sender.url);
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