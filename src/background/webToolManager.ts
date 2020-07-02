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

    private static _getServiceTypes() {
        chrome.storage.local.get(
            <IExtensionLocalSettings>{ serviceTypes: {} },
            ({ serviceTypes }: IExtensionLocalSettings) => this.serviceTypes = serviceTypes
        );
    }

    private static _setServiceTypes(map: ServiceTypesMap) {
        chrome.storage.local.set(
            <IExtensionLocalSettings>{ serviceTypes: map }
        );
    }

    private static onStoreChange(changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) {

        if (areaName != 'local') {
            return;
        }

        const serviceTypes = changes['serviceTypes'];
        if (serviceTypes) {
            WebToolManager.serviceTypes = serviceTypes.newValue;
        }
    }

    static serviceTypes: ServiceTypesMap = (() => {
        chrome.storage.onChanged.addListener(WebToolManager.onStoreChange);
        WebToolManager._getServiceTypes();
        return {};
    })();

    static getServiceUrls() {
        const serviceTypes = this.serviceTypes;
        const serviceUrls = Object.keys(serviceTypes).sort().reduce((map, url) => {
            const serviceType = serviceTypes[url];
            let urls = map[serviceType] || [];
            urls.push(url);
            map[serviceType] = urls;
            return map;
        }, <ServiceUrlsMap>{});
        return serviceUrls;
    }

    static addServiceTypes(serviceTypes: ServiceTypesMap) {
        return this.updateServiceTypes(serviceTypes);
    }

    static removeServiceTypes(serviceTypes: ServiceTypesMap) {
        return this.updateServiceTypes(undefined, serviceTypes);
    }

    private static toOriginServiceTypesMap(serviceTypesMap: ServiceTypesMap) {
        return Object.keys(serviceTypesMap).reduce(
            (map, url) => {
                const serviceType = serviceTypesMap[url];
                const origin = WebToolManager.toOrigin(url);
                map[origin] = (map[origin] || []).concat(serviceType);
                return map;
            },
            <{ [origin: string]: string[] }>{}
        );
    }

    static updateServiceTypes(serviceTypesAdded: ServiceTypesMap = {}, serviceTypesRemoved: ServiceTypesMap = {}) {

        let serviceTypes = this.serviceTypes;

        Object.keys(serviceTypesAdded).forEach(serviceUrl => serviceTypes[serviceUrl] = serviceTypesAdded[serviceUrl]);
        Object.keys(serviceTypesRemoved).forEach(serviceUrl => delete serviceTypes[serviceUrl]);

        const origins = this.toOriginServiceTypesMap(serviceTypes);
        const originsAdded = this.toOriginServiceTypesMap(serviceTypesAdded);
        const originsRemoved = this.toOriginServiceTypesMap(serviceTypesRemoved);

        // avoid permission removing for edited url
        Object.keys(originsAdded).forEach(origin => {
            if (originsAdded[origin] && originsRemoved[origin]) {
                delete originsAdded[origin];
                delete originsRemoved[origin];
            }
        });

        // avoid permission removing for another service with same origin but different path
        Object.keys(originsRemoved).forEach(origin => {
            if (origins[origin]) {
                delete originsRemoved[origin];
            }
        });

        this._setServiceTypes(serviceTypes);

        return { originsAdded, originsRemoved };
    }

    static async cleanupServiceTypes() {
        const serviceTypes = this.serviceTypes;
        await Promise.all(Object.keys(serviceTypes).map(origin => this.isAllowed([origin]).then(result => !result && delete serviceTypes[origin])));
        this._setServiceTypes(serviceTypes);
    }
}