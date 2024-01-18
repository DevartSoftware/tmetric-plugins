class Trac implements WebToolIntegration {

    showIssueId = true;

    // Project ticket url:
    // https://HOST/*/ticket/TICKET_ID
    matchUrl = '*://*/ticket/*';

    issueElementSelector = '#main > #content.ticket';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host =
            $$('#trac-ticket-title > a', issueElement) || // ver < 1.0
            $$('.trac-id', issueElement); // ver >= 1.0
        if (host) {
            linkElement.classList.add('devart-timer-link-trac');
            host.parentElement.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const match = /^(.+)\/ticket\/(\d+)(#.*)?$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        const issueId = '#' + match[2];

        const issueName = $$.try('.summary', issueElement).textContent;
        if (!issueName) {
            return;
        }

        // split by EN DASH and get last part
        let projectName = document.title.split('–').pop();
        if (projectName) {
            projectName = projectName.trim();
        }

        const serviceType = 'Trac';
        const serviceUrl = match[1];
        const issueUrl = 'ticket/' + match[2];

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Trac());