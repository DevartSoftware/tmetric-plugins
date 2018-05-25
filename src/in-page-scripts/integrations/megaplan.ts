class Megaplan implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = /(.*megaplan.*)\/(task|project|event|crm|deals)(?:.*\/Task)?\/(\d+)/

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let container = $$.try('Button[data-name=favorite], .favorite-icon-normal').parentElement;
        if (container) {
            container.insertBefore(linkElement, container.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // https://myaccount.megaplan.ru/project/1000000/card/
        let projectName = $$.try('a.CLink', null, (_: HTMLAnchorElement) => /\/project\/\d/.test(_.href)).textContent;

        // https://myaccount.megaplan.ru/task/1000004/card/
        // https://myaccount.megaplan.ru/task/filter/all/Task/1000004
        let match = source.fullUrl.match(this.matchUrl);
        let serviceUrl = match[1];
        let issueType = match[2];
        let issueNumber = match[3];

        let serviceType = 'Megaplan';
        let issueName = document.title;
        let issueUrl = `/${issueType}/${issueNumber}/card/`;
        let issueId = '#' + issueNumber;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Megaplan());