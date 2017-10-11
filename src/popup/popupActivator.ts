if (typeof document != undefined) {

    document.body.style.visibility = 'visible'; // Prevent flickering (TE-128)
    document.body.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Prevent flickering (TE-131)

    if (location.search == '?integration') {
        new PagePopupController();
    } else {
        new PopupController();
    }
}