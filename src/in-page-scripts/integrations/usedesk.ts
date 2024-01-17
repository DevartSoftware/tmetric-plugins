class Usedesk implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://*.usedesk.*/tickets/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$.visible('#ticket-buttons');
        if (host) {
            linkElement.classList.add('btn', 'btn-default');
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {
        let issueName = $$.try('#editable_subject').textContent;

        if (!issueName) {
            return;
        }

        let projectName = $$.try('#ticket-channel-name').textContent;

        let issueId: string;
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'UseDesk';
        let issueUrl: string;

        // https://*.usedesk.ru/tickets/TICKET_ID
        let match = /^\/tickets\/(\d+)$/.exec(source.path);
        if (match) {
            issueId = `#${match[1]}`;
            issueUrl = source.path;
        }

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Usedesk());