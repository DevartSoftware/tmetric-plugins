if (typeof document !== 'undefined') {

    const sendBackgroundMessage = (message: ITabMessage) => {
        chrome.runtime.sendMessage(message, response => {
            let error = chrome.runtime.lastError;

            // Background page is not loaded yet
            if (error) {
                console.log(`${message.action}: ${JSON.stringify(error, null, '  ')}`)
            }
        });
    }

    const popupId = 'tmetric-popup';

    const showPopup = () => {

        if (document.querySelector('#' + popupId)) {
            return;
        }

        let iframe = document.createElement('iframe');
        iframe.id = popupId;
        iframe.src = `${constants.browserSchema}://${constants.extensionUUID}/popup/popup.html?integration`;

        Object.assign(iframe.style, {
            position: 'fixed',
            zIndex: 999999,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block'
        });

        // iframe does not work in frameset.
        if (document.body.nodeName == 'FRAMESET') {
            sendBackgroundMessage({ action: 'forcePutTimer' });
        } else {
            document.body.appendChild(iframe);
        }
    }

    const hidePopup = () => {
        let popup = document.querySelector('#' + popupId);
        if (popup) {
            popup.remove();
        }
    }

    let constants: Models.Constants;

    chrome.runtime.onMessage.addListener((message: ITabMessage) => {

        switch (message.action) {

            case 'showPopup':
                showPopup();
                break;

            case 'hidePopup':
                hidePopup();
                break;

            case 'setConstants':
                constants = message.data;
                break;

            // Only for Firefox to inject scripts in right order
            case 'initPage':
                sendBackgroundMessage({ action: 'getConstants' });
                break;

            // Only for Firefox to show error alerts
            case 'error':
                let a = alert; // prevent strip in release;
                a(constants.extensionName + '\n\n' + message.data.message);
                break;
        }
    });

    sendBackgroundMessage({ action: 'getConstants' });
}