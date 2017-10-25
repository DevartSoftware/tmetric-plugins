class ChromeExtension extends ExtensionBase {

    constructor() {
        super();

        // Convert patterns to regexps
        const patternToRegExp = (matchPattern: string) => new RegExp('^' + matchPattern
            .replace(/[\-\/\\\^\$\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
            .replace(/\*/g, '.*'));
        let contentScripts = chrome.runtime.getManifest().content_scripts
            .map(group => Object.assign({
                regexp_matches: (group.matches || []).map(patternToRegExp),
                regexp_exclude_matches: (group.exclude_matches || []).map(patternToRegExp)
            }, group));

        // Manualy inject content scripts on all tabs.
        chrome.tabs.query({}, tabs =>
            tabs && tabs.forEach(tab => {

                let loadedFiles: { [path: string]: boolean } = {};

                // Check each content scripts group
                contentScripts.forEach(group => {

                    // Do not load same scripts twice
                    let jsFiles = (group.js || []).filter(path => !loadedFiles[path]);
                    let cssFiles = (group.css || []).filter(path => !loadedFiles[path]);
                    let runAt = group.run_at;

                    const isMatched = (regexps: RegExp[]) => regexps.some(r => r.test(tab.url));

                    // Inject JS and CSS
                    if (isMatched(group.regexp_matches) && !isMatched(group.regexp_exclude_matches)) {
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