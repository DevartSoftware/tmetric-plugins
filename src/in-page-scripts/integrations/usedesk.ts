class Usedesk implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://*.usedesk.*/tickets/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$.visible('#ticket-buttons');
        if (host) {
            linkElement.classList.add('btn', 'btn-default');
            host.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const issueName = $$.try('#editable_subject').textContent;
        if (!issueName) {
            return;
        }

        const projectName = $$.try('#ticket-channel-name').textContent;

        let issueId: string | undefined;
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'UseDesk';
        let issueUrl: string | undefined;

        // https://*.usedesk.ru/tickets/TICKET_ID
        const match = /^\/tickets\/(\d+)$/.exec(source.path);
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