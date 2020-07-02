class ContentScriptsRegistrator {

    private static instance: ContentScriptsRegistrator;

    constructor() {

        if (!ContentScriptsRegistrator.instance) {

            ContentScriptsRegistrator.instance = this;

            chrome.permissions.onAdded.addListener(event => this.register(event.origins));
            chrome.permissions.onRemoved.addListener(event => this.unregister(event.origins));
        }

        return ContentScriptsRegistrator.instance;
    }

    private scripts: { [origin: string]: RegisteredContentScript[] } = {};

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

    async register(origins?: string[]) {

        this.unregister(origins);

        const serviceTypes = WebToolManager.serviceTypes;
        const webToolDescriptions: { [serviceType: string]: WebToolDescription } = getWebToolDescriptions().reduce((map, item) => (map[item.serviceType] = item) && map, {});

        origins = (await Promise.all(
            (origins || Object.keys(serviceTypes)).map(
                origin => new Promise<string>(
                    resolve => chrome.permissions.contains({ origins: [origin] }, result => resolve(result ? origin : null))
                )
            )
        )).filter(origin => !!origin);

        origins.forEach(async origin => {

            const serviceType = serviceTypes[origin];

            const webToolDescription = webToolDescriptions[serviceType];
            if (!webToolDescription || !webToolDescription.scripts) {
                return;
            }

            const paths: string[] = [];

            if (webToolDescription.scripts.paths) {
                paths.push(...webToolDescription.scripts.paths.map(path => origin.replace(/\*$/, path)))
            } else {
                paths.push(origin);
            }

            const scripts: ContentScripts = {
                allFrames: webToolDescription.scripts.allFrames,
                js: webToolDescription.scripts.js,
                css: webToolDescription.scripts.css,
                paths
            };

            const scriptsOptions = this.getScriptOptions(scripts);

            this.scripts[origin] = [... await Promise.all(scriptsOptions.map(this.registerInternal))];

            chrome.tabs.query({ url: paths, status: 'complete' }, tabs => {
                tabs.forEach(tab => {
                    chrome.tabs.executeScript(tab.id, {
                        code: `chrome.runtime.sendMessage({action:'injectContentScripts',data:{}})`,
                        allFrames: true
                    });
                });
            });
        });
    }

    async unregister(origins?: string[]) {
        (origins || Object.keys(this.scripts)).forEach(origin => {
            let script = this.scripts[origin];
            if (!script) {
                return;
            }
            script.forEach(s => s.unregister());
            delete this.scripts[origin];
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
}
