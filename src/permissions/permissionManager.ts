class PermissionManager {

    private toPermissions(items: WebTool[]) {
        return <chrome.permissions.Permissions>{
            origins: items.reduce((origins, item) => {
                let urls = item.origins.map(toOrigin).filter(o => !!o);
                origins.push(...urls);
                return origins;
            }, <string[]>[])
        };
    }

    requestPermissions(items: WebTool[]) {

        let callback: (result: boolean) => void;

        let permissions = this.toPermissions(items);

        chrome.permissions.request(permissions, result => callback(result));

        return new Promise<boolean>(resolve => callback = resolve).then(async result => {

            if (!result) {
                return result;
            }

            await enableWebTools(items);

            let message = <IContentScriptRegistratorMessage>{
                action: 'registerContentScripts',
                data: items.map(item => item.serviceType)
            };

            chrome.runtime.sendMessage(message);

            return result;
        });
    }

    removePermissions(items: WebTool[]) {

        let callback: (result: boolean) => void;

        let permissions = this.toPermissions(items);

        chrome.permissions.remove(permissions, result => callback(result));

        return new Promise<boolean>(resolve => callback = resolve).then(async result => {

            if (!result) {
                return result;
            }

            await disableWebTools(items);

            let message = <IContentScriptRegistratorMessage>{
                action: 'unregisterContentScripts',
                data: items.map(item => item.serviceType)
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