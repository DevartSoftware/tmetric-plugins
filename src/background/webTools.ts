const toOrigin = function (input: string) {

    if (!input) {
        return;
    }

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

const getEnabledWebTools = function () {
    return new Promise<WebTool[]>(resolve => {
        chrome.storage.local.get(<IExtensionLocalSettings>{ webTools: [] }, ({ webTools }: IExtensionLocalSettings) => {
            resolve(webTools);
        });
    });
}

const enableWebTools = function (items: WebTool[]) {
    return getEnabledWebTools().then(enabledItems => {

        let enabledItemsDictionary = enabledItems.reduce((map, item) => {
            map[item.serviceType] = item;
            return map;
        }, <{ [serviceType: string]: WebTool }>{});

        items.forEach(item => {

            let itemOrigins = item.origins.map(toOrigin).filter(o => !!o);

            let storedItem = enabledItemsDictionary[item.serviceType];

            if (storedItem) {

                if (!storedItem.origins) {
                    storedItem.origins = [];
                }

                storedItem.origins.splice(0);
                storedItem.origins.push(...itemOrigins);

            } else {

                enabledItems.push({
                    serviceType: item.serviceType,
                    origins: itemOrigins
                });
            }
        });

        enabledItems = enabledItems.filter(item => !!item.origins.length);

        return new Promise(resolve => {
            chrome.storage.local.set(<IExtensionLocalSettings>{ webTools: enabledItems }, () => {
                resolve();
            });
        });
    });
}

const disableWebTools = function (items: WebTool[]) {
    return getEnabledWebTools().then(enabledItems => {

        let itemsDictionary = items.reduce((map, item) => {
            map[item.serviceType] = item;
            return map;
        }, <{ [serviceType: string]: WebTool }>{});

        enabledItems = enabledItems.filter(item => !itemsDictionary[item.serviceType]);

        return new Promise(resolve => {
            chrome.storage.local.set(<IExtensionLocalSettings>{ webTools: enabledItems }, () => {
                resolve();
            });
        });
    });
}