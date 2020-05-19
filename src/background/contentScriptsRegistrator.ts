class ContentScriptsRegistrator {

    private static instance: ContentScriptsRegistrator;

    constructor() {
        if (!ContentScriptsRegistrator.instance) {
            ContentScriptsRegistrator.instance = this;
        }

        return ContentScriptsRegistrator.instance;
    }

    private scripts = <{ [serviceType: string]: RegisteredContentScript[] }>{};

    private getIntegration(serviceType: string) {
        return getIntegrations().find(i => i.serviceType == serviceType);
    }

    private getScriptOptions({ scripts }: Integration) {

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
                matches: scripts.matches,
                js: js.map(file => ({ file })),
                css: css.map(file => ({ file })),
                allFrames: scripts.all_frames || false,
                runAt: 'document_end'
            },
            {
                matches: scripts.matches,
                js: [
                    { file: 'in-page-scripts/topmostPage.js' }
                ],
                allFrames: false,
                runAt: scripts.run_at
            }
        ];
    }

    async register(serviceType: string) {

        const integration = this.getIntegration(serviceType);
        if (!integration || !integration.scripts) {
            return;
        }

        this.unregister(serviceType);

        let scriptsOptions = this.getScriptOptions(integration);

        this.scripts[serviceType] = [... await Promise.all(scriptsOptions.map(this.registerInternal))];
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

    unregister(serviceType: string) {
        let scripts = this.scripts[serviceType];
        if (scripts) {
            scripts.forEach(s => s.unregister());
            delete this.scripts[serviceType];
        }
    }
}