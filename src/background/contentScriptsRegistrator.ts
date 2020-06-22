class ContentScriptsRegistrator {

    private static instance: ContentScriptsRegistrator;

    constructor() {

        if (!ContentScriptsRegistrator.instance) {

            ContentScriptsRegistrator.instance = this;

            chrome.permissions.onAdded.addListener(event => this.onPermissionsAdded(event));
            chrome.permissions.onRemoved.addListener(event => this.onPermissionsRemoved(event));
        }

        return ContentScriptsRegistrator.instance;
    }

    private async onPermissionsAdded(event: chrome.permissions.Permissions) {
        await WebToolManager.enableWebTools();
        this.register();
    }

    private async onPermissionsRemoved(event: chrome.permissions.Permissions) {
        await WebToolManager.disableWebTools();
        this.register();
    }

    private scripts: { [serviceType: string]: RegisteredContentScript[] } = {};

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

    async register() {

        Object.keys(this.scripts).forEach(serviceType => this.scripts[serviceType].forEach(s => s.unregister()));
        this.scripts = {};

        const webTools = await WebToolManager.getEnabledWebTools();
        const webToolDescriptions = getWebToolDescriptions();

        webTools.forEach(async webTool => {

            const { serviceType, origins } = webTool;

            const webToolDescription = webToolDescriptions.find(i => i.serviceType == serviceType);
            if (!webToolDescription || !webToolDescription.scripts) {
                return;
            }

            const paths = origins.reduce((matches, origin) => {
                if (webToolDescription.scripts.paths) {
                    webToolDescription.scripts.paths.forEach(path => {
                        matches.push(origin.replace(/\*$/, path));
                    });
                } else {
                    matches.push(origin);
                }
                return matches;
            }, <string[]>[]);

            const scripts: ContentScripts = {
                allFrames: webToolDescription.scripts.allFrames,
                js: webToolDescription.scripts.js,
                css: webToolDescription.scripts.css,
                paths
            };

            const scriptsOptions = this.getScriptOptions(scripts);

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
}
