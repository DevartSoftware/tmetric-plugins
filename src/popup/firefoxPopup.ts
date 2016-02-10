class PopupFirefox extends PopupBase {

    constructor() {
        super();
        this.initResizeListener();
        this.initWindow();
    }

    initResizeListener() {

        var target = document.querySelector('body');
        var config = { attributes: true, childList: true, characterData: true, subtree: true };
        var bodyHeightOld = null;

        var observer = new MutationObserver((mutations) => {
            var bodyHeight = document.body.offsetHeight;
            if (bodyHeightOld != bodyHeight) {
                bodyHeightOld = bodyHeight;
                this.resize();
            }
        });

        observer.observe(target, config);
    }

    initWindow() {
        // focus window to make popup hiding work on escape key pressed
        self.port.on('popup_showed', () => {
            window.focus();
        });
        // close popup when window loses focus
        // e.g., mouse click outside popup
        window.addEventListener('blur', (event) => {
            this.close();
        }, false);
    }

    resize() {
        self.port.emit('popup_resize', {
            width: document.body.offsetWidth,
            height: document.body.offsetHeight
        });
    }

    callBackground(request: IPopupRequest) {
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
}

new PopupFirefox();