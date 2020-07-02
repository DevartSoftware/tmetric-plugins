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

    static toServiceUrl(input: string) {

        if (!input) {
            return;
        }

        const match = WebToolManager.urlRe.exec(input);
        if (!match) {
            return;
        }

        const [all, protocol = 'https://', host, port = '', path = '/*'] = match;

        if (!host) {
            return;
        }

        if (['http://', 'https://'].indexOf(protocol) < 0) {
            return;
        }

        return `${protocol}${host}${port}${path}`;

    }

    static isMatch(url: string, origin: string) {
        let urlOrigin = this.toOrigin(url);
        let originRe = origin
            .replace(/[\/\.]/g, '\\$&')
            .replace(/\*/g, '.+');
        let pattern = `^${originRe}`;
        return new RegExp(pattern, 'i').test(urlOrigin);
    }

    static toServiceTypesMap(webTools: WebTool[]) {
        return webTools.reduce((map, webTool) => webTool.origins.map(origin => map[origin] = webTool.serviceType) && map, <ServiceTypesMap>{});
    }

    static async isAllowed(origins: string[]) {
        return new Promise<boolean>(resolve => chrome.permissions.contains({ origins }, resolve));
    }

    static async getServiceTypes() {
        return new Promise<ServiceTypesMap>(resolve => {
            chrome.storage.local.get(
                <IExtensionLocalSettings>{ serviceTypes: {} },
                ({ serviceTypes }: IExtensionLocalSettings) => resolve(serviceTypes)
            );
        });
    }

    static async getServiceUrls() {
        const serviceTypes = await this.getServiceTypes();
        const serviceUrls = Object.keys(serviceTypes).sort().reduce((map, url) => {
            const serviceType = serviceTypes[url];
            let urls = map[serviceType] || [];
            urls.push(url);
            map[serviceType] = urls;
            return map;
        }, <ServiceUrlsMap>{});
        return serviceUrls;
    }

    static async addServiceTypes(map: ServiceTypesMap) {

        let serviceTypes = await this.getServiceTypes();

        Object.keys(map).forEach(serviceUrl => serviceTypes[serviceUrl] = map[serviceUrl]);

        return new Promise(resolve => {
            chrome.storage.local.set(<IExtensionLocalSettings>{ serviceTypes }, () => {
                resolve();
            });
        });
    }

    static async removeServiceTypes(map: ServiceTypesMap) {

        let serviceTypes = await this.getServiceTypes();

        Object.keys(map).forEach(serviceUrl => delete serviceTypes[serviceUrl]);

        return new Promise(resolve => {
            chrome.storage.local.set(<IExtensionLocalSettings>{ serviceTypes }, () => {
                resolve();
            });
        });
    }

    static async updateServiceTypes(itemsAdded: ServiceTypesMap, itemsRemoved: ServiceTypesMap) {

        let serviceTypes = await this.getServiceTypes();

        Object.keys(itemsAdded).forEach(serviceUrl => serviceTypes[serviceUrl] = itemsAdded[serviceUrl]);
        Object.keys(itemsRemoved).forEach(serviceType => delete serviceTypes[serviceType]);

        return new Promise(resolve => {
            chrome.storage.local.set(<IExtensionLocalSettings>{ serviceTypes }, () => {
                resolve();
            });
        });
    }
}