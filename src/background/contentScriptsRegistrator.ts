class ContentScriptsRegistrator {

    private static instance: ContentScriptsRegistrator;

    constructor() {
        if (!ContentScriptsRegistrator.instance) {
            ContentScriptsRegistrator.instance = this;
        }

        return ContentScriptsRegistrator.instance;
    }

    private scripts = <{ [serviceType: string]: RegisteredContentScript[] }>{};

    private getScriptOptions(scripts: ContentScripts) {

        let js = [
            'in-page-scripts/utils.js',
            'in-page-scripts/integrationService.js',
            'in-page-scripts/page.js',
            ...(scripts.js || []),
            'in-page-scripts/init.js'
        ];

        let css = [
            'css/timer-link.css',
            ...(scripts.css || [])
        ];

        return <RegisteredContentScriptOptions[]>[
            {
                matches: scripts.paths,
                js: js.map(file => ({ file })),
                css: css.map(file => ({ file })),
                allFrames: scripts.allFrames || false,
                runAt: 'document_end'
            },
            {
                matches: scripts.paths,
                js: [
                    { file: 'in-page-scripts/topmostPage.js' }
                ],
                allFrames: false,
                runAt: scripts.runAt
            }
        ];
    }

    async register(serviceTypes?: string[]) {

        this.unregister(serviceTypes);

        let services = await getServices();
        if (serviceTypes) {
            services = services.filter(s => serviceTypes.indexOf(s.serviceType) > -1);
        }

        const integrations = getIntegrations();

        services.forEach(async service => {

            const { serviceType, serviceUrls } = service;

            const integration = integrations.find(i => i.serviceType == serviceType);
            if (!integration || !integration.scripts) {
                return;
            }

            const paths = serviceUrls.reduce((matches, origin) => {
                if (integration.scripts.paths) {
                    integration.scripts.paths.forEach(path => {
                        matches.push(origin.replace(/\*$/, path));
                    });
                } else {
                    matches.push(origin);
                }
                return matches;
            }, <string[]>[]);

            const scripts: ContentScripts = {
                allFrames: integration.scripts.allFrames,
                js: integration.scripts.js,
                css: integration.scripts.css,
                paths
            };

            let scriptsOptions = this.getScriptOptions(scripts);

            this.scripts[serviceType] = [... await Promise.all(scriptsOptions.map(this.registerInternal))];
        });
    }


    private registerInternal(options: RegisteredContentScriptOptions) {

        let method: (options: RegisteredContentScriptOptions) => Promise<RegisteredContentScript>;

        if (typeof browser === 'object' && browser.contentScripts) {
            method = browser.contentScripts.register;
        } else if (typeof chrome === 'object' && chrome.contentScripts) {
            method = chrome.contentScripts.register;
        } else {
            method = (options) => Promise.resolve({ unregister: () => undefined });
        }

        return method(options);
    }

    unregister(serviceTypes?: string[]) {

        (serviceTypes || Object.keys(this.scripts)).forEach(serviceType => {

            let scripts = this.scripts[serviceType];
            if (scripts) {
                scripts.forEach(s => s.unregister());
                delete this.scripts[serviceType];
            }
        });
    }
}