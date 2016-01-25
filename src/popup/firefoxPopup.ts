class PopupFirefox extends PopupBase {

    constructor() {
        super();
    }

    callBackground(request: IPopupRequest) {
        console.log('popup callBackground', request);
        return new Promise((resolve, reject) => {
            self.port.once('popup_request_' + request.action + '_response', (response: IPopupResponse) => {
                resolve(response);
            });
            self.port.emit('popup_request', request);
        });
    }

    close() {
        self.port.emit('popup_close');
    }

    switchState(name: string) {
        super.switchState(name);
        self.port.emit('popup_resize', {
            width: document.body.offsetWidth,
            height: document.body.offsetHeight
        });
    }
}

new PopupFirefox();