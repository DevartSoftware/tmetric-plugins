class PermissionManager {

    private toPermissions(services: WebToolService[]) {
        return <chrome.permissions.Permissions>{
            origins: services.reduce((origins, item) => {
                let urls = item.serviceUrls.map(toOrigin).filter(o => !!o);
                origins.push(...urls);
                return origins;
            }, <string[]>[])
        };
    }

    requestPermissions(services: WebToolService[]) {

        let callback: (result: boolean) => void;

        let permissions = this.toPermissions(services);

        chrome.permissions.request(permissions, result => callback(result));

        return new Promise<boolean>(resolve => callback = resolve).then(async result => {

            if (!result) {
                return result;
            }

            await setServices(services);

            let message = <IIntegrationMessage>{
                action: 'registerIntegrationScripts',
                data: services.map(service => service.serviceType)
            };

            chrome.runtime.sendMessage(message);

            return result;
        });
    }

    removePermissions(services: WebToolService[]) {

        let callback: (result: boolean) => void;

        let permissions = this.toPermissions(services);

        chrome.permissions.remove(permissions, result => callback(result));

        return new Promise<boolean>(resolve => callback = resolve).then(async result => {

            if (!result) {
                return result;
            }

            await setServices(services.map(s => ({
                serviceType: s.serviceType,
                serviceUrls: []
            })));

            let message = <IIntegrationMessage>{
                action: 'unregisterIntegrationScripts',
                data: services.map(service => service.serviceType)
            };

            chrome.runtime.sendMessage(message);

            return result;
        });
    }

    cleanupPermissions() {

        let callback: (result: boolean) => void;

        chrome.permissions.getAll(allPermissions => {

            let requiredPermissions = chrome.runtime.getManifest().permissions;
            let origins = allPermissions.origins.filter(o => requiredPermissions.indexOf(o) < 0);

            let permissions = <chrome.permissions.Permissions>{
                origins
            };

            chrome.permissions.remove(permissions, result => callback(result));
        });

        return new Promise<boolean>(resolve => callback = resolve);

    }
}