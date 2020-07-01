class PermissionManager {

    private toPermissions(items: WebTool[]) {
        return <chrome.permissions.Permissions>{
            origins: items.reduce((origins, item) => {
                let urls = item.origins.map(WebToolManager.toOrigin).filter(o => !!o);
                origins.push(...urls);
                return origins;
            }, <string[]>[])
        };
    }

    requestPermissions(items: WebTool[]) {

        let savePromise = WebToolManager.addServiceTypes(items);

        let permissions = this.toPermissions(items);
        let permissionsPromise = typeof browser != 'undefined' ?
            browser.permissions.request(<browser.permissions.Permissions>permissions) :
            new Promise(resolve => chrome.permissions.request(permissions, result => resolve(result)));

        return savePromise.then(() => permissionsPromise);
    }

    removePermissions(items: WebTool[]) {

        let savePromise = WebToolManager.removeServiceTypes(items);

        let permissions = this.toPermissions(items);
        let permissionsPromise = typeof browser != 'undefined' ?
            browser.permissions.remove(<browser.permissions.Permissions>permissions) :
            new Promise(resolve => chrome.permissions.remove(permissions, result => resolve(result)));

        return savePromise.then(() => permissionsPromise);
    }

    updatePermissions(itemsAdded: WebTool[], itemsRemoved: WebTool[]) {

        let savePromise = WebToolManager.updateServiceTypes(itemsAdded, itemsRemoved);

        let permissionsAdded = this.toPermissions(itemsAdded);
        let permissionsRemoved = this.toPermissions(itemsRemoved);

        let permissionsPromises: Promise<boolean>[] = [];

        if (typeof browser != 'undefined') {
            permissionsPromises = [
                browser.permissions.request(<browser.permissions.Permissions>permissionsAdded),
                browser.permissions.remove(<browser.permissions.Permissions>permissionsRemoved)
            ];
        } else {
            permissionsPromises = [
                new Promise(resolve => chrome.permissions.request(permissionsAdded, result => resolve(result))),
                new Promise(resolve => chrome.permissions.remove(permissionsRemoved, result => resolve(result)))
            ];
        }

        return savePromise.then(() => Promise.all(permissionsPromises));
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
