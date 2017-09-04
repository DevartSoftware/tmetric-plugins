class PagePopupController extends PopupController {

    private _issue: Integrations.WebToolIssueTimer;

    constructor(params: { [key: string]: string }) {
        super(params);

        this.insertFrame();
        this.registerListeners();
    }

    hidePopupAction = this.wrapBackgroundAction<Models.Timer, void>('hideAllPopups');
    putExternalTimerAction = this.wrapBackgroundAction<Integrations.WebToolIssueTimer, void>('putExternalTimer');

    registerListeners() {
        $(document).mouseup(e => {
            if (e.target.tagName.toLowerCase() == 'body') {
                this.close();
            }
        });
    }

    /**
     * @override
     */
    close() {
        this.hidePopupAction();
    }

    private insertFrame() {
        let style = document.createElement('style');
        let css = `
body {
position: fixed; background-color: rgba(0, 0, 0, .5); width: 100%;
padding: 0 !important; top: 0; left: 0; height: 100%;
}
.container {
position: absolute; top: 50%; left: 50%; margin-left: -175px; margin-top: -211px;
width: 320px; padding: 15px; background-color: #ffffff;
}
`;
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    /** @override */
    onStartClick() {
        this.putExternalTimerAction(this._issue);
        this.close();
    }
}