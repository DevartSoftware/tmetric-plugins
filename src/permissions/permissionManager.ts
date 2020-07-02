class PermissionManager {

    private toOriginsMap(map) {
        return Object.keys(map).reduce(
            (map, url) => (map[WebToolManager.toOrigin(url)] = true) && map,
            <{ [origin: string]: boolean }>{}
        );
    }

    private toOriginsArray(map) {
        return Object.keys(this.toOriginsMap(map)).sort();
    }

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

    requestPermissions(map: ServiceTypesMap) {
        const save = WebToolManager.addServiceTypes(map);
        const request = this.request(this.toOriginsArray(map));
        return save.then(() => request);
    }

    removePermissions(map: ServiceTypesMap) {
        const save = WebToolManager.removeServiceTypes(map);
        const remove = this.remove(this.toOriginsArray(map));
        return save.then(() => remove);
    }

    updatePermissions(itemsAdded: ServiceTypesMap, itemsRemoved: ServiceTypesMap) {

        const save = WebToolManager.updateServiceTypes(itemsAdded, itemsRemoved);

        const originsAdded = this.toOriginsMap(itemsAdded);
        const originsRemoved = this.toOriginsMap(itemsRemoved);

        // avoid permission removing for edited url
        Object.keys(originsAdded).forEach(origin => {
            if (originsAdded[origin] && originsRemoved[origin]) {
                delete originsAdded[origin];
                delete originsRemoved[origin];
            }
        });

        const update = Promise.all([
            this.request(this.toOriginsArray(originsAdded)),
            this.remove(this.toOriginsArray(originsRemoved)),
        ]);
        return save.then(() => update);
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
