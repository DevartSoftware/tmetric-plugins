class PagePopupController extends PopupController {

    constructor() {
        super(true);

        this.initFrame();
    }

    hidePopupAction = this.wrapBackgroundAction<Models.Timer, void>('hideAllPopups');

    /** @override */
    close() {
        this.hidePopupAction();
    }

    /**
     * @override
     */
    getDefaultProjectSelectionOption(): number {
        return this.newIssue.projectName
            ? this.createNewProjectOption.id
            : this.selectProjectOption.id;
    }

    /**
     * @override
     * @param timer
     * @param originalTimer
     */
    putTimer(timer: WebToolIssueTimer, originalTimer?: WebToolIssueTimer) {
        this.putTimerAction([timer, originalTimer]);
        this.close();
    }

    private initFrame() {

        let style = document.createElement('style');

        // Set background-color as important to override inline style.
        // It needs to prevent flickering popup.
        let css = `
body {
    background-color: rgba(0, 0, 0, .5) !important;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    padding: 0 !important;
}
.container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 380px;
    margin-left: -175px;
    margin-top: -211px;
    background-color: #ffffff;
}
`;
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);

        $(document).mousedown(e => {
            if (e.target.tagName.toLowerCase() == 'body') {
                this.close();
            }
        });
    }
}