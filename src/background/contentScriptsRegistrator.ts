class ContentScriptsRegistrator {

    private static instance: ContentScriptsRegistrator;

    constructor() {

        if (!browser.scripting) {
            const c = console;
            c.error('browser.scripting not supported');
        }

        if (!ContentScriptsRegistrator.instance) {

            ContentScriptsRegistrator.instance = this;

            browser.permissions.onAdded.addListener(async event => {
                await this.register(event.origins);
            });
            browser.permissions.onRemoved.addListener(async event => {
                if (event.origins) {
                    const serviceTypeByUrl = await WebToolManager.getServiceTypes();
                    const affectedServiceUrls = await this.getAffectedUrls(serviceTypeByUrl, event.origins);
                    this.unregister(affectedServiceUrls)
                }
            });
        }

        return ContentScriptsRegistrator.instance;
    }

    private addRequiredScriptOptions(scriptId: string, scripts: chrome.scripting.RegisteredContentScript) {

        const js = [
            'unified-ext.js',
            'in-page-scripts/utils.js',
            'in-page-scripts/integrationService.js',
            'in-page-scripts/page.js',
            ...(scripts.js || []),
            'in-page-scripts/init.js'
        ];

        const css = [
            'css/timer-link.css',
            ...(scripts.css || [])
        ];

        let origins = scripts.matches?.map(url => WebToolManager.toOrigin(url)!).filter(origin => origin);
        origins = [...new Set(origins)];

        return [
            {
                id: 'tmetric_' + scriptId,
                matches: scripts.matches,
                js,
                css,
                allFrames: scripts.allFrames || false,
                runAt: 'document_end'
            },
            {
                id: 'tmetric_topmost_' + scriptId,
                matches: origins,
                js: [
                    'unified-ext.js',
                    'in-page-scripts/topmostPage.js'
                ],
                allFrames: false,
                runAt: scripts.runAt
            }
        ] as chrome.scripting.RegisteredContentScript[];
    }

    private getScriptId(url: string) {
        return Array.prototype.map.call(url, c => c.charCodeAt(0).toString(16)).join('');
    }

    async unregister(serviceUrls: string[]) {
        if (!browser.scripting) {
            return;
        }
        for (let url of serviceUrls) {
            const scriptId = this.getScriptId(url);
            try {
                let ids = ['tmetric_' + scriptId, 'tmetric_topmost_' + scriptId];
                let scripts: chrome.scripting.RegisteredContentScript[] | undefined;
                try {
                    scripts = (await browser.scripting.getRegisteredContentScripts({ ids }));
                }
                catch {
                }
                if (scripts?.length! > 0) {
                    ids = scripts!.map(x => x.id);
                    if (ids.length) {
                        await browser.scripting.unregisterContentScripts({ ids });
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    }

    private async getAffectedUrls(serviceTypeByUrl: ServiceTypesMap, origins?: string[]) {

        // example:
        // "https:∕∕*.easyredmine.com/*", "http:∕∕jira.server.local/*", "https:∕∕*.atlassian.com/*"
        const serviceUrls = Object.keys(serviceTypeByUrl);

        const requiredRegexp = /^.*:\/\/.*\.tmetric\.com(?:\:\d+)?\/.*/i;
        const regexpByServiceTypeUrl = serviceUrls.reduce(
            (map, url) => (map[url] = WebToolManager.toUrlRegExp(url)) && map,
            {} as { [serviceUrl: string]: RegExp });

        return serviceUrls.filter(url => {

            // ignore required "*.tmetric.com" permissions
            if (!url || requiredRegexp.test(url)) {
                return false;
            }

            // filter by passed origins
            if (origins && !origins.some(origin => WebToolManager.isMatch(url, origin))) {
                return false;
            }

            // filter non overlapped urls
            return serviceUrls.every(x => {
                return x == url // same url 
                    || serviceTypeByUrl[x] != serviceTypeByUrl[url] // another service type url
                    || !regexpByServiceTypeUrl[x].test(url) // non overlapped url
            });
        });
    }

    async register(origins?: string[]) {

        if (!browser.scripting) {
            return;
        }
        console.log('ContentScriptsRegistrator.register', origins);

        // example:
        // "https://*.easyredmine.com/*": "Redmine",
        // "http ://jira.server.local/*": "Jira",
        // "https://*.atlassian.com/*": "Jira"
        const serviceTypeByUrl = await WebToolManager.getServiceTypes();
        const affectedServiceUrls = await this.getAffectedUrls(serviceTypeByUrl, origins);

        await this.unregister(affectedServiceUrls);

        // get permissions
        const permissionByServiceUrl = {} as { [serviceUrl: string]: boolean };
        await Promise.all(
            affectedServiceUrls.map(async serviceUrl => {
                let hasPermission = false;
                try {
                    hasPermission = await browser.permissions.contains({ origins: [serviceUrl] });
                }
                catch (e) {
                    const c = console; // save console to prevent strip in release;
                    c.error(e);
                }
                permissionByServiceUrl[serviceUrl] = hasPermission;
            })
        );

        console.log('ContentScriptsRegistrator.register serviceUrls', affectedServiceUrls)

        const descriptionByServiceType = getWebToolDescriptions().reduce(
            (map, item) => (map[item.serviceType] = item) && map,
            {} as { [serviceType: string]: WebToolDescription });

        affectedServiceUrls.forEach(async serviceUrl => {

            if (!permissionByServiceUrl[serviceUrl]) {
                return;
            }

            // abandoned integration
            const webToolDescription = descriptionByServiceType[serviceTypeByUrl[serviceUrl]];
            if (!webToolDescription || !webToolDescription.scripts) {
                return;
            }

            // get scripts options
            const scripts = webToolDescription.scripts;
            const options = {
                allFrames: scripts.allFrames,
                js: (scripts.js || []),
                css: (scripts.css || []),
                matches: [serviceUrl],
            } as chrome.scripting.RegisteredContentScript;
            const scriptsOptions = this.addRequiredScriptOptions(this.getScriptId(serviceUrl), options);

            try {
                await browser.scripting.registerContentScripts(scriptsOptions);
            }
            catch (error) {
                console.error('registerContentScripts', error);
            }
        });
    }
}
