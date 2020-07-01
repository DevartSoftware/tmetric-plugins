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
            action: 'getItegratedWebTools'
        }

        const items = await new Promise<WebTool[]>(resolve => {
            chrome.runtime.sendMessage(message, resolve);
        });

        onClick = async () => {

            if (items && items.length) {

                let permissionManager = new PermissionManager();
                await permissionManager.requestPermissions(items);

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
