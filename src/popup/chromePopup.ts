class PopupChrome extends PopupBase {

    constructor() {
        super();
    }

    callBackground(request: IPopupRequest) {
        console.log('popup callBackground', request);
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(request, (response: IPopupResponse) => {
                console.log('popup sendBackground response', response);
                resolve(response);
            });
        });
    }

    close() {
        window.close();
    }
}

new PopupChrome();