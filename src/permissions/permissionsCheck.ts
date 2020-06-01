$(document).ready(async () => {

    let services = await getServices();
    let permissionManager = new PermissionManager();

    $('#continue').click(function () {
        if (!services) {
            return;
        }

        if (services.length) {
            permissionManager.requestPermissions(services)
                .then(() => openPermissionsPage());
        } else {
            openPermissionsPage();
        }
    });

    function openPermissionsPage() {
        window.location.href = chrome.runtime.getURL('permissions/permissions.html');
    }
});
