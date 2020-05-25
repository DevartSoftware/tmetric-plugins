$(document).ready(() => {

    let services: WebToolService[];

    chrome.storage.local.get(<IExtensionLocalSettings>{ services: [] }, (data: IExtensionLocalSettings) => {
        services = data && data.services || [];
    });

    $('#continue').click(() => {
        if (!services) {
            return;
        }

        if (services.length) {
            requestPermissions();
        } else {
            openPermissionsPage();
        }
    });

    function toOrigin(url: string) {
        let l = new URL(url);
        return `${l.origin}/*`;
    }

    function requestPermissions() {

        let permissions = <chrome.permissions.Permissions>{
            origins: services.reduce((urls, item) => {
                urls.push(...item.serviceUrls.map(toOrigin));
                return urls;
            }, <string[]>[])
        };

        chrome.permissions.request(permissions, result => {
            if (result) {
                services.forEach(service => registerScripts(service.serviceType));
            }
            openPermissionsPage();
        });
    }

    function registerScripts(serviceType: string) {

        let message = <IIntegrationMessage>{
            action: 'registerIntegrationScripts',
            data: serviceType
        };

        chrome.runtime.sendMessage(message, () => { });
    }

    function openPermissionsPage() {
        window.location.href = chrome.runtime.getURL('permissions/permissions.html'); 
    }

});
