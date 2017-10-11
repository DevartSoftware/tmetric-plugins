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
                tabs && tabs.forEach(tab => {
                    let isMatched = (regexp: RegExp) => regexp.test(tab.url);
                    if (matches.some(isMatched) && !excludeMatches.some(isMatched)) {
                        if (jsFiles) {
                            jsFiles.forEach(file => chrome.tabs.executeScript(tab.id, { file, runAt }));
                        }
                        if (cssFiles) {
                            cssFiles.forEach(file => chrome.tabs.insertCSS(tab.id, { file }));
                        }
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
}

new ChromeExtension();