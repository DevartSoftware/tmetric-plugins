class PermissionManager {

    private request(origins: string[]) {
        return typeof browser != 'undefined' ?
            browser.permissions.request({ origins }) :
            new Promise<boolean>(resolve => chrome.permissions.request({ origins }, result => resolve(result)));
    }

    private remove(origins: string[]) {
        return typeof browser != 'undefined' ?
            browser.permissions.remove({ origins }) :
            new Promise<boolean>(resolve => chrome.permissions.remove({ origins }, result => resolve(result)));
    }

    requestPermissions(serviceTypes: ServiceTypesMap) {

        const { originsAdded } = WebToolManager.addServiceTypes(serviceTypes);

        return this.request(Object.keys(originsAdded));
    }

    removePermissions(serviceTypes: ServiceTypesMap) {

        const { originsRemoved } = WebToolManager.removeServiceTypes(serviceTypes);

        return this.remove(Object.keys(originsRemoved));
    }

    updatePermissions(serviceTypesAdded: ServiceTypesMap, serviceTypesRemoved: ServiceTypesMap) {

        const { originsAdded, originsRemoved } = WebToolManager.updateServiceTypes(serviceTypesAdded, serviceTypesRemoved);

        return Promise.all([
            this.request(Object.keys(originsAdded)),
            this.remove(Object.keys(originsRemoved)),
        ]);
    }

    cleanupPermissions() {

        let callback: (result: boolean) => void;

        chrome.permissions.getAll(allPermissions => {

            const manifest = chrome.runtime.getManifest();
            const requiredPermissions = (manifest.permissions as string[])
                .concat(
                    ...manifest.content_scripts.map(_ => _.matches as string[])
                );
            const origins = allPermissions.origins.filter(o => requiredPermissions.indexOf(o) < 0);

            chrome.permissions.remove({ origins }, result => callback(result));
        });

        return new Promise<boolean>(resolve => callback = resolve);

    }
}
