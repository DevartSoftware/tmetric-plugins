class ContentScriptsRegistrator {

    private static instance: ContentScriptsRegistrator;

    constructor() {

        if (!ContentScriptsRegistrator.instance) {

            ContentScriptsRegistrator.instance = this;

            browser.permissions.onAdded.addListener(event => this.register(event.origins));
            browser.permissions.onRemoved.addListener(event => this.unregister(event.origins));
        }

        return ContentScriptsRegistrator.instance;
    }

    private addRequiredScriptOptions(scriptId: string, scripts: chrome.scripting.RegisteredContentScript) {

        const js = [
            'browser.js',
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
                    'browser.js',
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

    async unregister(origins?: string[]) {
        if (!origins) {
            return;
        }
        const serviceTypes = await WebToolManager.getServiceTypes();

        const serviceUrls = Object
            .keys(serviceTypes)
            .filter(url => origins.some(origin => WebToolManager.isMatch(url, origin)));
        for (let url of serviceUrls) {
            const scriptId = this.getScriptId(url);
            try {
                await browser.scripting.unregisterContentScripts({
                    ids: ['tmetric_' + scriptId, 'tmetric_topmost_' + scriptId]
                });
            }
            catch (e) {
                console.error(e);
            }
        }
    }

    async register(origins?: string[]) {

        console.log('ContentScriptsRegistrator.register origins', origins);

        await this.unregister(origins);

        const serviceTypes = await WebToolManager.getServiceTypes();
        const serviceTypeUrls = Object.keys(serviceTypes);
        const serviceTypeUrlRegExps = serviceTypeUrls.reduce((map, url) => (map[url] = WebToolManager.toUrlRegExp(url)) && map, {} as { [serviceUrl: string]: RegExp });

        const webToolDescriptions = getWebToolDescriptions().reduce((map, item) => (map[item.serviceType] = item) && map, {} as { [serviceType: string]: WebToolDescription });

        let serviceUrls = serviceTypeUrls;

        // filter by passed origins
        if (origins) {
            serviceUrls = serviceUrls.filter(url => origins.some(origin => WebToolManager.isMatch(url, origin)));
        }

        // filter non overlapped urls
        serviceUrls = serviceUrls.filter(a => {
            return serviceTypeUrls.every(b => {
                return b == a // same url 
                    || serviceTypes[b] != serviceTypes[a] // another service type url
                    || !serviceTypeUrlRegExps[b].test(a) // non overlapped url
            });
        });

        // filter permitted urls
        serviceUrls = (await Promise.all(
            serviceUrls.map(async serviceUrl => {
                try {
                    if (await browser.permissions.contains({ origins: [serviceUrl] })) {
                        return serviceUrl;
                    }
                }
                catch(e) {
                    const c = console; // save console to prevent strip in release;
                    c.error(e);
                }
                return '';
            })
        )).filter(item => !!item);

        console.log('ContentScriptsRegistrator.register serviceUrls', serviceUrls)

        serviceUrls.forEach(async serviceUrl => {

            const serviceType = serviceTypes[serviceUrl];

            const webToolDescription = webToolDescriptions[serviceType];
            if (!webToolDescription || !webToolDescription.scripts) {
                return;
            }

            const scripts = webToolDescription.scripts;

            const matches = [serviceUrl];

            const options = {
                allFrames: scripts.allFrames,
                js: (scripts.js || []),
                css: (scripts.css || []),
                matches: matches,
            } as chrome.scripting.RegisteredContentScript;

            const scriptsOptions = this.addRequiredScriptOptions(this.getScriptId(serviceUrl), options);

            await browser.scripting.registerContentScripts(scriptsOptions);
        });
    }
}
