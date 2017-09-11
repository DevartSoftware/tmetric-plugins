class PagePopupController extends PopupController {

    constructor() {
        super();

        this.initFrame();
        this.registerListeners();
    }

    hidePopupAction = this.wrapBackgroundAction<Models.Timer, void>('hideAllPopups');

    registerListeners() {
        $(document).mousedown(e => {
            if (e.target.tagName.toLowerCase() == 'body') {
                this.close();
            }
        });
    }

    /** @override */
    close() {
        this.hidePopupAction();
    }

    private initFrame() {

        let style = document.createElement('style');
        let css = `
body {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    padding: 0 !important;
    background-color: rgba(0, 0, 0, .5);
}
.container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 320px;
    margin-left: -175px;
    margin-top: -211px;
    background-color: #ffffff;
}
`;
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }
}