if (typeof document != undefined) {

    let url = window.location.href;
    let isPagePopup = url.indexOf('?tab=true') >= 0;
    if (isPagePopup) {
        new PagePopupController();
    } else {
        new PopupController();
    }
}