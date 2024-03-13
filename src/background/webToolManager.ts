class WebToolManager {

    private static urlRe = /^([^:]+:\/\/)?([^:/?#]+)(:\d+)?(\/[^?#]*)?(\?[^?#]*)?(\#[^?#]*)?$/i;

    static toOrigin(input: string | null | undefined) {

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

        const [all, protocol = 'https://', host, port = ''] = match;
        let path = match[4] || '/';

        if (!path.endsWith('*')) {
            path += '*';
        }

        if (!path.endsWith('/*')) {
            path = path.replace(/\*$/, '/*');
        }

        if (!host) {
            return;
        }

        if (['http://', 'https://'].indexOf(protocol) < 0) {
            return;
        }

        return `${protocol}${host}${port}${path}`;

    }

    static toUrlRegExp(url: string) {
        const pattern = '^' + url
            .replace(/[\/\.]/g, '\\$&')
            .replace(/\*/g, '.*');
        return new RegExp(pattern, 'i');
    }

    static isMatch(url: string | null | undefined, origin: string) {
        const urlOrigin = this.toOrigin(url);
        const originRegExp = this.toUrlRegExp(origin);
        return originRegExp.test(urlOrigin!);
    }

    static toServiceTypesMap(webTools: WebTool[]) {
        return webTools.reduce((map, webTool) => webTool.origins.map(origin => map[origin] = webTool.serviceType) && map, {} as ServiceTypesMap);
    }

    static async isAllowed(origins: string[]) {
        return new Promise<boolean>(resolve => browser.permissions.contains({ origins }, resolve));
    }

    private static _getServiceTypes(callback?: (serviceTypes: ServiceTypesMap) => void) {
        browser.storage.local.get(
            { serviceTypes: {} } as IExtensionLocalSettings,
            (value) => {
                this.serviceTypes = (value as IExtensionLocalSettings).serviceTypes || {};
                callback && callback(this.serviceTypes);
            }
        );
    }

    private static _setServiceTypes(serviceTypes: ServiceTypesMap, callback?: () => void) {
        this.serviceTypes = serviceTypes;
        browser.storage.local.set(
            { serviceTypes: serviceTypes } as IExtensionLocalSettings,
            () => {
                callback && callback();
            }
        );
    }

    static getServiceTypes() {
        return new Promise<ServiceTypesMap>(resolve => this._getServiceTypes(resolve));
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
        browser.storage.onChanged.addListener(WebToolManager.onStoreChange);
        WebToolManager._getServiceTypes();
        return {};
    })();

    static getServiceUrls(serviceTypes = this.serviceTypes) {
        if (!serviceTypes) {
            return {};
        }
        const serviceUrls = Object.keys(serviceTypes).sort().reduce((map, url) => {
            const serviceType = serviceTypes[url];
            let urls = map[serviceType] || [];
            urls.push(url);
            map[serviceType] = urls;
            return map;
        }, {} as ServiceUrlsMap);
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
                if (origin) {
                    map[origin] = (map[origin] || []).concat(serviceType);
                }
                return map;
            },
            {} as { [origin: string]: string[] }
        );
    }

    static updateServiceTypes(serviceTypesAdded: ServiceTypesMap = {}, serviceTypesRemoved: ServiceTypesMap = {}) {

        const serviceTypes = this.serviceTypes;

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
        const serviceTypes = await this.getServiceTypes();
        await Promise.all(Object.keys(serviceTypes).map(origin => this.isAllowed([origin]).then(result => !result && delete serviceTypes[origin])));
        this._setServiceTypes(serviceTypes);
    }
}