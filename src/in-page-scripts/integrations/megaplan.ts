class Megaplan implements WebToolIntegration {

    showIssueId = false;

    matchUrl = /(.*megaplan.*)\/(task|project|event|crm|deals)(?:.*\/Task)?\/(\d+)/

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const container = $$.try('Button[data-name=favorite], .favorite-icon-normal').parentElement;
        if (container) {
            container.insertBefore(linkElement, container.firstElementChild);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        // https://myaccount.megaplan.ru/project/1000000/card/
        const projectName = $$.try('a.CLink', null, (_: HTMLAnchorElement) => /\/project\/\d/.test(_.href)).textContent;

        // https://myaccount.megaplan.ru/task/1000004/card/
        // https://myaccount.megaplan.ru/task/filter/all/Task/1000004
        const match = source.fullUrl.match(this.matchUrl);
        const serviceUrl = match?.[1];
        const issueType = match?.[2];
        const issueNumber = match?.[3];

        const serviceType = 'Megaplan';
        const issueName = document.title;
        const issueUrl = `/${issueType}/${issueNumber}/card/`;
        const issueId = '#' + issueNumber;

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Megaplan());