$(document).ready(async () => {

    let items = await getEnabledWebTools();
    let permissionManager = new PermissionManager();

    $('#continue').click(async () => {
        if (!items) {
            return;
        }

        if (items.length) {
            await permissionManager.requestPermissions(items);
        }

        openPermissionsPage();
    });

    function openPermissionsPage() {
        window.location.href = chrome.runtime.getURL('permissions/permissions.html');
    }
});
