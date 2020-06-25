class WebToolManager {

    private static urlRe = /^([^:]+:\/\/)?([^:/?#]+)(:\d+)?(\/[^?#]*)?(\?[^?#]*)?(\#[^?#]*)?$/i;

    static toOrigin (input: string) {

        if (!input) {
            return;
        }

        const match = WebToolManager.urlRe.exec(input);
        if (!match) {
            return;
        }

        const [all, protocol = 'https://', host, port = ''] = match;

        if (!host) {
            return;
        }

        if (['http://', 'https://'].indexOf(protocol) < 0) {
            return;
        }

        return `${protocol}${host}${port}/*`;

    }

    static isMatch(url: string, origin: string) {
        let urlOrigin = this.toOrigin(url);
        let originRe = origin
            .replace(/[\/\.]/g, '\\$&')
            .replace(/\*/g, '.+');
        let pattern = `^${originRe}`;
        return new RegExp(pattern, 'i').test(urlOrigin);
    }

    static async getWebTools() {
        const serviceTypes = await this.getServiceTypes();
        const webToolsMap = Object.keys(serviceTypes).sort().reduce((map, origin) => {
            const serviceType = serviceTypes[origin];
            let webTool = map[serviceType] || { serviceType, origins: [] };
            webTool.origins.push(origin);
            map[serviceType] = webTool;
            return map;
        }, <{ [serviceType: string]: WebTool }>{});
        const webTools = Object.keys(webToolsMap).map(key => webToolsMap[key]);
        return webTools;
    }

    static async isAllowed(origin: string) {
        return new Promise<boolean>(resolve => chrome.permissions.contains({ origins: [origin] }, resolve));
    }

    static async getServiceTypes() {
        return new Promise<ServiceTypesMap>(resolve => {
            chrome.storage.local.get(
                <IExtensionLocalSettings>{ serviceTypes: {} },
                ({ serviceTypes }: IExtensionLocalSettings) => resolve(serviceTypes)
            );
        });
    }

    static async addServiceTypes(items: WebTool[]) {

        let serviceTypes = await this.getServiceTypes();

        items.forEach(item => item.origins.forEach(origin => serviceTypes[origin] = item.serviceType));

        return new Promise(resolve => {
            chrome.storage.local.set(<IExtensionLocalSettings>{ serviceTypes }, () => {
                resolve();
            });
        });
    }

    static async removeServiceTypes(items: WebTool[]) {

        let serviceTypes = await this.getServiceTypes();

        items.forEach(item => item.origins.forEach(origin => delete serviceTypes[origin]));

        return new Promise(resolve => {
            chrome.storage.local.set(<IExtensionLocalSettings>{ serviceTypes }, () => {
                resolve();
            });
        });
    }
}