if (typeof document != undefined) {

    let params: { [name: string]: string } = {};
    (window.location.href.split('?')[1] || '')
        .split('&')
        .forEach(param => {
            let [key, value] = param.split('=');
            params[key] = decodeURIComponent((value || '').replace(/\+/g, ' '));
        });

    if (params['tab'] == 'true') {
        new PagePopupController(params);
    } else {
        new PopupController(params);
    }
}