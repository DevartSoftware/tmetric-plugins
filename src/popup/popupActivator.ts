if (typeof document != undefined) {
    if (location.search == '?integration') {
        new PagePopupController();
    } else {
        new PopupController();
    }
}