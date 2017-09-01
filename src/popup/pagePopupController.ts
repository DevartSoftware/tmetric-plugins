class PagePopupController extends PopupController {

    constructor() {
        super();

        this.insertCSS();
        this.registerListeners();
    }

    hidePopupAction = this.wrapBackgroundAction<Models.Timer, void>('hidePopup');

    /**
     * @override
     */
    primarySwitchingState(data: IPopupInitData) {
        if (data.timer && data.timer.isStarted) {
            if (this.isLongRunning(data.timer.startTime)) {
                this.fillFixForm(data.timer);
                this.switchState(this.states.fixing);
            } else {
                this.fillCreateForm(data.title);
                this.switchState(this.states.creating);
            }
        } else {
            this.fillCreateForm(data.title);
            this.switchState(this.states.creating);
        }
    }

    registerListeners() {
        this.onClose();
    }

    /**
     * @override
     */
    close() {
        this.hidePopupAction();
    }

    private onClose() {
        $(document).mouseup(e => {
            if (e.target.tagName.toLowerCase() == 'body') {
                this.close();
            }
        });
    }

    private insertCSS() {
        let style = document.createElement('style');
        style.appendChild(document.createTextNode([
            'body {',
            'position: fixed; background-color: rgba(0, 0, 0, .5); width: 100%;',
            'padding: 0 !important; top: 0; left: 0; height: 100%;',
            '}',
            ' .container {',
            'position: absolute; top: 50%; left: 50%; margin-left: -175px; margin-top: -211px;',
            'width: 320px; padding: 15px; background-color: #ffffff;',
            '}'
        ].join('')));
        document.head.appendChild(style);
    }
}