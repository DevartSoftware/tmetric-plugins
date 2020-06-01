const toOrigin = function (input: string) {

    // add protocol if not present
    // permission origins must start with http or https
    if (!input.startsWith('http')) {
        input = 'https://' + input;
    }

    const match = /^https?:\/\/[^/]+/i.exec(input);
    if (match) {
        return `${match[0]}/*`;
    }
}

const getServices = function () {
    return new Promise<WebToolService[]>(resolve => {
        chrome.storage.local.get(<IExtensionLocalSettings>{ services: [] }, (data: IExtensionLocalSettings) => {
            let services = data && data.services || [];
            resolve(services);
        });
    });
}

const setServices = function (services: WebToolService[]) {
    return getServices().then(storedServices => {

        let storedServicesDictionary = storedServices.reduce((map, service) => {
            map[service.serviceType] = service;
            return map;
        }, <{ [serviceType: string]: WebToolService }>{});

        services.forEach(service => {

            let serviceOrigins = service.serviceUrls.map(toOrigin).filter(o => !!o);

            let storedService = storedServicesDictionary[service.serviceType];
            if (storedService) {

                if (!storedService.serviceUrls) {
                    storedService.serviceUrls = [];
                }

                storedService.serviceUrls.splice(0);
                storedService.serviceUrls.push(...serviceOrigins);
            } else {

                storedServices.push({
                    serviceType: service.serviceType,
                    serviceUrls: serviceOrigins
                });
            }
        });

        storedServices = storedServices.filter(s => !!s.serviceUrls.length);

        return new Promise(resolve => {
            chrome.storage.local.set(<IExtensionLocalSettings>{ services: storedServices }, () => {
                resolve();
            });
        });
    });
}
