class ContentScriptsRegistrator {

    private static instance: ContentScriptsRegistrator;

    private _pendingOrigins = {} as { [origin: string]: boolean; }

    private _pendingTimer: number | undefined;

    constructor() {

        if (!browser.scripting) {
            const c = console;
            c.error('browser.scripting not supported');
        }

        if (!ContentScriptsRegistrator.instance) {

            ContentScriptsRegistrator.instance = this;

            // Process with a delay to avoid double triggering (see handlePermissionMessage below)
            const checkPendingOrigins = async () => {
                if (this._pendingTimer) {
                    clearTimeout(this._pendingTimer);
                }
                this._pendingTimer = setTimeout(async () => {
                    this._pendingTimer = undefined;
                    const removed = [] as string[];
                    const added = [] as string[];
                    for (let s in this._pendingOrigins) {
                        (this._pendingOrigins[s] ? added : removed).push(s);
                    }
                    this._pendingOrigins = {};
                    if (removed.length) {
                        await this.unregister(removed);
                    }
                    if (added.length) {
                        await this.register(added);
                    }
                }, 500);
            };

            browser.permissions.onAdded.addListener(async event => {
                if (event.origins) {
                    this.setPending(event.origins, true);
                    checkPendingOrigins();
                }
            });
            browser.permissions.onRemoved.addListener(async event => {
                if (event.origins) {
                    this.setPending(event.origins, false);
                    checkPendingOrigins();
                }
            });
        }

        return ContentScriptsRegistrator.instance;
    }

    // Permission event does not always triggered (TMET-10408, TMET-10814),
    // so we send an IPermissionRequest.
    // However, permission events are also handled because the script
    // may terminate before sending the IPermissionRequest(TMET-10830)
    handlePermissionMessage(request: IPermissionRequest, callback: (response: IMessageResponse) => void) {
        let promise: Promise<void> | undefined;
        const action = request?.action;
        if (request?.data?.length) {
            this.removePending(request.data)
            if (request.action === 'originsAdded') {
                promise = this.register(request.data);
            } else if (request.action === 'originsRemoved') {
                promise = this.unregister(request.data);
            }
        }
        if (promise) {
            promise.then(() => callback({ action }));
        } else {
            callback({ action });
        }
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

        const runAt = scripts.runAt;
        return [
            {
                id: 'tmetric_' + scriptId,
                matches: scripts.matches,
                js,
                css,
                allFrames: scripts.allFrames || false,
                runAt
            },
            {
                id: 'tmetric_topmost_' + scriptId,
                matches: origins,
                js: [
                    'unified-ext.js',
                    'in-page-scripts/topmostPage.js'
                ],
                allFrames: false,
                runAt
            }
        ] as chrome.scripting.RegisteredContentScript[];
    }

    private getScriptId(url: string) {
        return Array.prototype.map.call(url, c => c.charCodeAt(0).toString(16)).join('');
    }

    async unregister(origins: string[]) {

        // Urls can already be removed from the map, but they still need to be unregistered
        const serviceTypeByUrl = Object.assign(
            {},
            this.latestRegisterMap,
            await WebToolManager.getServiceTypes());
        const affectedServiceUrls = await this.getAffectedUrls(serviceTypeByUrl, origins);
        await this.unregisterUrls(affectedServiceUrls);
    }

    private async unregisterUrls(serviceUrls: string[]) {
        if (!browser.scripting) {
            return;
        }
        for (let url of serviceUrls) {
            const scriptId = this.getScriptId(url);
            try {
                let ids = ['', '_topmost', '_embed'].map(x => `tmetric${x}_${scriptId}`)
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

        const regexpByServiceTypeUrl = serviceUrls.reduce(
            (map, url) => (map[url] = WebToolManager.toUrlRegExp(url)) && map,
            {} as { [serviceUrl: string]: RegExp });

        return serviceUrls.filter(url => {

            // ignore required "*.tmetric.com" permissions
            if (!url) {
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

    latestRegisterMap: ServiceTypesMap = {};

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
        this.latestRegisterMap = serviceTypeByUrl;
        const affectedServiceUrls = await this.getAffectedUrls(serviceTypeByUrl, origins);

        await this.unregisterUrls(affectedServiceUrls);

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
                runAt: scripts.runAt || 'document_end'
            } as chrome.scripting.RegisteredContentScript;
            const scriptId = this.getScriptId(serviceUrl);
            const scriptsOptions = this.addRequiredScriptOptions(scriptId, options);

            // embed script to main context (TMET-10664)
            if (webToolDescription.embeddedScripts) {
                scriptsOptions.push({
                    id: 'tmetric_embed_' + scriptId,
                    matches: [serviceUrl],
                    js: webToolDescription.embeddedScripts.js || [],
                    css: webToolDescription.embeddedScripts.css || [],
                    allFrames: webToolDescription.embeddedScripts.allFrames,
                    runAt: webToolDescription.embeddedScripts.runAt || 'document_end',
                    world: 'MAIN'
                });
            }

            scriptsOptions.forEach(x => {
                x.css?.length || delete x.css;
                x.js?.length || delete x.js;
            });

            try {
                await browser.scripting.registerContentScripts(scriptsOptions);
            }
            catch (error) {
                const c = console;
                c.error('registerContentScripts', error);
            }
        });
    }

    setPending(origins: string[], isEnabled: boolean) {
        for (let s of origins) {
            this._pendingOrigins[s] = isEnabled;
        }
    }

    removePending(origins: string[]) {
        for (let s of origins) {
            delete this._pendingOrigins[s];
        }
    }
}
