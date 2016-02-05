class PopupChrome extends PopupBase {

    constructor() {
        super();
    }

    callBackground(request: IPopupRequest) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(request, (response: IPopupResponse) => {
                resolve(response);
            });
        });
    }

    close() {
        window.close();
    }
}

new PopupChrome();