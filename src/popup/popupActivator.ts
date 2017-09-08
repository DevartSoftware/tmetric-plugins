if (typeof document != undefined) {

    let params: { [name: string]: string } = {};
    (window.location.href.split('?')[1] || '')
        .split('&')
        .forEach(param => {
            let [key, value] = param.split('=');
            params[key] = decodeURIComponent(value || '');
        });

    function parseBoolean(value: string) {
        return /^(true|yes|1|on)$/i.test(value);
    }

    function parseString(value: string) {
        return value || null;
    }

    function parseIntArray(value: string) {
        return value ? value.split(',').map(s => parseInt(s)) : [];
    }

    function parseStringArray(value: string) {
        return value ? value.split(',').map(s => parseString(s)) : [];
    }

    let issue = <Integrations.WebToolIssueTimer>{
        isStarted: <any>parseBoolean,
        issueId: <any>parseString,
        issueName: <any>parseString,
        issueUrl: <any>parseString,
        projectName: <any>parseString,
        serviceType: <any>parseString,
        serviceUrl: <any>parseString,
        showIssueId: <any>parseBoolean,
        tagsNames: <any>parseStringArray
    };

    for (let key in issue) {
        issue[key] = issue[key](params[key]);
    }

    if (issue.issueName) {
        new PagePopupController(issue);
    } else {
        new PopupController();
    }
}