class Trac implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    // Project ticket url:
    // https://HOST/*/ticket/TICKET_ID
    matchUrl = '*://*/ticket/*';

    issueElementSelector = '#main > #content.ticket';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host =
            $$('#trac-ticket-title > a', issueElement) || // ver < 1.0
            $$('.trac-id', issueElement); // ver >= 1.0
        if (host) {
            linkElement.classList.add('devart-timer-link-trac');
            host.parentElement.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        var match = /^(.+)\/ticket\/(\d+)(#.*)?$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        var issueId = '#' + match[2];

        var issueName = $$.try('.summary', issueElement).textContent;
        if (!issueName) {
            return;
        }

        // split by EN DASH and get last part
        var projectName = document.title.split('–').pop();
        if (projectName) {
            projectName = projectName.trim();
        }

        var serviceType = 'Trac';

        var serviceUrl = match[1];

        var issueUrl = 'ticket/' + match[2];

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Trac());