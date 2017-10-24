class ChromeExtension extends ExtensionBase {

    constructor() {
        super();

        // Manualy inject content scripts on all tabs.

        let contentScripts = chrome.runtime.getManifest().content_scripts;

        let patternToRegExp = (matchPattern: string) => new RegExp('^' + matchPattern
            .replace(/[\-\/\\\^\$\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
            .replace(/\*/g, '.*'));
        let matches = contentScripts.map(x => x.matches.map(patternToRegExp));

        chrome.tabs.query({}, tabs =>
            tabs && tabs.forEach(tab => {

                let loadedFiles: { [path: string]: boolean } = {};

                contentScripts.forEach((group, groupIndex) => {

                    // Do not load same scripts twice
                    let jsFiles = (group.js || []).filter(path => !loadedFiles[path]);
                    let cssFiles = (group.css || []).filter(path => !loadedFiles[path]);
                    let runAt = group.run_at;

                    let isMatched = (regexp: RegExp) => regexp.test(tab.url);
                    let excludeMatches = (group.exclude_matches || []).map(patternToRegExp);
                    if (matches[groupIndex].some(isMatched) && !excludeMatches.some(isMatched)) {
                        jsFiles.forEach(file => {
                            chrome.tabs.executeScript(tab.id, { file, runAt });
                            loadedFiles[file] = true;
                        });
                        cssFiles.forEach(file => {
                            chrome.tabs.insertCSS(tab.id, { file });
                            loadedFiles[file] = true;
                        });
                    }
                });
            }));
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