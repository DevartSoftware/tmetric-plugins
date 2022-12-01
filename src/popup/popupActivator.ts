if (typeof document != undefined) {

    document.body.style.visibility = 'visible'; // Prevent flickering (TE-128)

    let controller = location.search == '?integration' ?
        new PagePopupController() :
        new PopupController();
}