$(document).ready(async () => {

    const skipPermissionsRequest = await new Promise<boolean>(resolve => {
        browser.storage.local.get(
            { skipPermissionsRequest: false } as IExtensionLocalSettings,
            value => resolve((value as IExtensionLocalSettings).skipPermissionsRequest)
        );
    });

    let onClick = () => {
        browser.tabs.getCurrent(tab => {
            const tabId = tab?.id;
            tabId != null && browser.tabs.remove(tabId);
        });
    };

    if (!skipPermissionsRequest) {

        const message: ITabMessage = {
            action: 'getIntegratedServices'
        }

        const map = await browser.sendToBackgroundReliably(message) as ServiceTypesMap;

        onClick = async () => {

            if (map) {

                const permissionManager = new PermissionManager();
                await permissionManager.requestPermissions(map);

                await new Promise<void>(resolve => {
                    browser.storage.local.set(
                        { skipPermissionsRequest: true } as IExtensionLocalSettings,
                        () => resolve()
                    );
                });
            }

            window.location.href = browser.runtime.getURL('permissions/permissions.html');
        }
    }

    $('#continue').click(onClick);
});
