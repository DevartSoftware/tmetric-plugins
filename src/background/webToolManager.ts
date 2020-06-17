class WebToolManager {

    static toOrigin (input: string) {

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

    static isMatch(url: string, origin: string) {
        let urlOrigin = this.toOrigin(url);
        let originRe = origin
            .replace(/[\/\.]/g, '\\$&')
            .replace(/\*/g, '.+');
        let pattern = `^${originRe}`;
        return new RegExp(pattern, 'i').test(urlOrigin);
    }

    static getEnabledWebTools () {
        return new Promise<WebTool[]>(resolve => {
            chrome.storage.local.get(<IExtensionLocalSettings>{ webTools: [] }, ({ webTools }: IExtensionLocalSettings) => {
                resolve(webTools);
            });
        });
    }

    static enableWebTools (items: WebTool[]) {
        return this.getEnabledWebTools().then(enabledItems => {

            let enabledItemsDictionary = enabledItems.reduce((map, item) => {
                map[item.serviceType] = item;
                return map;
            }, <{ [serviceType: string]: WebTool }>{});

            items.forEach(item => {

                let itemOrigins = item.origins.map(this.toOrigin).filter(o => !!o);

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

    static disableWebTools (items: WebTool[]) {
        return this.getEnabledWebTools().then(enabledItems => {

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
}