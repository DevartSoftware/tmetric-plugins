$(document).ready(async () => {

    let services = await getServices();
    let permissionManager = new PermissionManager();

    $('#continue').click(async () => {
        if (!services) {
            return;
        }

        if (services.length) {
            await permissionManager.requestPermissions(services);
        }

        openPermissionsPage();
    });

    function openPermissionsPage() {
        window.location.href = chrome.runtime.getURL('permissions/permissions.html');
    }
});
