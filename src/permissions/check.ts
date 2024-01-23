$(document).ready(async () => {

    const skipPermissionsRequest = await new Promise<boolean>(resolve => {
        chrome.storage.local.get(
            { skipPermissionsRequest: false } as IExtensionLocalSettings,
            value => resolve((value as IExtensionLocalSettings).skipPermissionsRequest)
        );
    });

    let onClick = () => {
        chrome.tabs.getCurrent(tab => {
            const tabId = tab?.id;
            tabId != null && chrome.tabs.remove(tabId);
        });
    };

    if (!skipPermissionsRequest) {

        const message: ITabMessage = {
            action: 'getIntegratedServices'
        }

        const map = await new Promise<ServiceTypesMap>(resolve => {
            chrome.runtime.sendMessage(message, resolve);
        });

        onClick = async () => {

            if (map) {

                const permissionManager = new PermissionManager();
                await permissionManager.requestPermissions(map);

                await new Promise<void>(resolve => {
                    chrome.storage.local.set(
                        { skipPermissionsRequest: true } as IExtensionLocalSettings,
                        () => resolve()
                    );
                });
            }

            window.location.href = chrome.runtime.getURL('permissions/permissions.html');
        }
    }

    $('#continue').click(onClick);
});
