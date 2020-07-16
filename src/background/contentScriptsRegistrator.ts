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

    private addRequiredScriptOptions(scripts: RegisteredContentScriptOptions) {

        let js: FileOrCode[] = [
            { file: 'in-page-scripts/utils.js' },
            { file: 'in-page-scripts/integrationService.js' },
            { file: 'in-page-scripts/page.js' },
            ...(scripts.js || []),
            { file: 'in-page-scripts/init.js' }
        ];

        let css: FileOrCode[] = [
            { file: 'css/timer-link.css' },
            ...(scripts.css || [])
        ];

        return <RegisteredContentScriptOptions[]>[
            {
                matches: scripts.matches,
                js: js,
                css: css,
                allFrames: scripts.allFrames || false,
                runAt: 'document_end'
            },
            {
                matches: scripts.matches,
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

        const serviceTypes = await WebToolManager.getServiceTypes();
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

            const scripts = webToolDescription.scripts;

            const matches: string[] = [];

            if (webToolDescription.scripts.paths) {
                matches.push(...scripts.paths.map(path => origin.replace(/\*$/, path)));
            } else {
                matches.push(origin);
            }

            const options: RegisteredContentScriptOptions = {
                allFrames: scripts.allFrames,
                js: (scripts.js || []).map(file => ({ file })),
                css: (scripts.css || []).map(file => ({ file })),
                matches: matches
            };

            const scriptsOptions = this.addRequiredScriptOptions(options);

            this.scripts[origin] = [... await Promise.all(scriptsOptions.map(this.registerInternal))];

            this.checkContentScripts(matches, scripts.allFrames);
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

    private checkContentScripts(matches: string[], allFrames: boolean) {

        console.log('checkContentScripts', { matches, allFrames })

        if (typeof chrome === 'object' && chrome.contentScripts) {
            chrome.tabs.query({ url: matches, status: 'complete' }, tabs => {
                tabs.forEach(tab => {

                    console.log('checkContentScripts', tab.id, tab.url)

                    chrome.tabs.executeScript(tab.id, {
                        code: `chrome.runtime.sendMessage({action:'checkContentScripts'})`,
                        allFrames
                    });
                });
            });
        }
    }
}
