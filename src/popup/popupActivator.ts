if (typeof document != undefined) {

    document.body.style.visibility = 'visible'; // Prevent flickering (TE-128)

    if (location.search == '?integration') {
        new PagePopupController();
    } else {
        new PopupController();
    }
}