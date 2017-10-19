if (typeof document !== 'undefined') {
    chrome.runtime.onMessage.addListener((message: ITabMessage) => {
        if (message.action == 'showPopup') {
            showPopup(message.data);
        } else if (message.action == 'hidePopup') {
            hidePopup();
        }

        initialize();
    });

    function showPopup(issue: WebToolIssueTimer) {

        let iframe = document.createElement('iframe');
        iframe.id = IntegrationService.popupId;
        iframe.src = `${IntegrationService.getBrowserSchema()}://${IntegrationService.getExtensionUUID()}/popup/popup.html?integration`;

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
        let popup = $$('#' + IntegrationService.popupId);
        if (popup) {
            popup.remove();
        }
    }
}