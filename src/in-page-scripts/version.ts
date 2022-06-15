(function () {
    const sendBackgroundMessage = (message: ITabMessage) => {

        chrome.runtime.sendMessage(message, response => {
            const error = chrome.runtime.lastError;

            // Background page is not loaded yet
            if (error) {
                console.log(`${message.action}: ${JSON.stringify(error, null, '  ')}`)
            }
        });
    }

    if (typeof document == undefined) {
        return;
    }

    let head = document.querySelector('head');
    if (!head) {
        return;
    }

    let appMeta = <HTMLMetaElement>head.querySelector('meta[name="application"]');
    if (!appMeta || appMeta.content != 'TMetric') {
        return;
    }

    let extensionInfo = { // object is updated from gulp build
        version: '4.4.6'
    };

    let metaName = 'tmetric-extension-version';

    let oldMeta = head.querySelector(`meta[name="${metaName}"]`);
    if (oldMeta) {
        head.removeChild(oldMeta);
    }

    let meta = document.createElement('meta');
    meta.name = metaName;
    meta.content = extensionInfo.version;
    head.appendChild(meta);

    chrome.runtime.onMessage.addListener((message: ITabMessage) => {
        switch (message.action) {

            case 'setConstants':

                let metaName = 'tmetric-extension-id';
                let oldMeta = head.querySelector(`meta[name="${metaName}"]`);
                if (oldMeta) {
                    head.removeChild(oldMeta);
                }

                let meta = document.createElement('meta');
                meta.name = metaName;
                meta.content = message.data.extensionUUID;
                head.appendChild(meta);

                break;
        }
    });

    sendBackgroundMessage({ action: 'getConstants' });
})();