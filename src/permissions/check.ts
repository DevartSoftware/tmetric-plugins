$(document).ready(async () => {

    const skipPermissionsRequest = await new Promise<boolean>(resolve => {
        chrome.storage.local.get(
            <IExtensionLocalSettings>{ skipPermissionsRequest: false },
            ({ skipPermissionsRequest }: IExtensionLocalSettings) => resolve(skipPermissionsRequest)
        );
    });

    let onClick = () => {
        chrome.tabs.getCurrent(tab => {
            chrome.tabs.remove(tab.id);
        });
    };

    if (!skipPermissionsRequest) {

        const message: ITabMessage = {
            action: 'getItegratedServices'
        }

        const map = await new Promise<ServiceTypesMap>(resolve => {
            chrome.runtime.sendMessage(message, resolve);
        });

        onClick = async () => {

            if (map) {

                let permissionManager = new PermissionManager();
                await permissionManager.requestPermissions(map);

                await new Promise<boolean>(resolve => {
                    chrome.storage.local.set(
                        <IExtensionLocalSettings>{ skipPermissionsRequest: true },
                        () => resolve()
                    );
                });
            }

            window.location.href = chrome.runtime.getURL('permissions/permissions.html');
        }
    }

    $('#continue').click(onClick);
});
