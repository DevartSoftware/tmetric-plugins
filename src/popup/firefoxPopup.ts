class PopupFirefox extends PopupBase {

    callBackground(request: IPopupRequest) {
        console.log('popup callBackground', request);
        return new Promise((resolve, reject) => {
            self.port.once('popup_request_' + request.action + '_response', (response: IPopupResponse) => {
                resolve(response);
            });
            self.port.emit('popup_request', request);
        });
    }

    constructor() {
        super();
    }
}

new PopupFirefox();