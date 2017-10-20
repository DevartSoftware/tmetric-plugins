if (typeof document !== 'undefined') {

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
        }
    });

    sendBackgroundMessage({ action: 'getConstants' });

    const popupId = 'tmetric-popup';

    function showPopup() {

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

        document.body.appendChild(iframe);
    }

    function hidePopup() {
        $$('#' + popupId).remove();
    }
}