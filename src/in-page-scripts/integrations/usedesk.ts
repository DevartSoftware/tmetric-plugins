class Usedesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*.usedesk.*/tickets/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$.visible('#ticket-buttons');
        if (host) {
            linkElement.classList.add('btn', 'btn-default', 'tmetrik-link');
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement:HTMLElement, source:Source):WebToolIssue {
        var issueName = $$.try('#editable_subject').textContent;
        if (!issueName) {
            return;
        }

        var projectName = $$.try('#ticket-channel-name').textContent;

        // https://*.usedesk.ru/tickets/TICKET_ID
        var match = /^\/tickets\/(\d+)$/.exec(source.path);
        if (match) {
            var issueId = match[1];
            var serviceType = 'UseDesk';
            var serviceUrl = source.protocol + source.host;
            var issueUrl = source.path;
        }

        return {issueId, issueName, projectName, serviceType, serviceUrl, issueUrl};
    }
}

IntegrationService.register(new Usedesk());