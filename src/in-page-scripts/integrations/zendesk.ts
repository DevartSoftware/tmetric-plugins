class Zendesk implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://*.zendesk.com/agent/tickets/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$.visible('header .pane.right');
        if (host) {
            linkElement.classList.add('btn', 'origin', 'devart-timer-link-zendesk');
            host.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        let issueNameElement = $$.visible<HTMLInputElement>('.ticket .editable input[name=subject]') ||
            $$.visible<HTMLInputElement>('.ticket .editable input[data-test-id=ticket-pane-subject]') || // TE-506
            $$.visible<HTMLInputElement>('.ticket input[data-test-id=omni-header-subject]'); // TE-669

        let issueName = issueNameElement && issueNameElement.value;
        if (!issueName) {
            return;
        }

        // Ticket url:
        // https://*.zendesk.com/agent/tickets/TICKET_ID or https://*.zendesk.com/agent/tickets/TICKET_ID/events
        let match = /^\/agent\/tickets\/(\d+)(?:\/events)?/.exec(source.path);
        let issueId: string | undefined;
        let issueUrl: string | undefined;
        if (match) {
            issueId = '#' + match[1];
            issueUrl = source.path;
        }

        const projectName = ''; // zendesk have no predefined field for project
        const serviceType = 'Zendesk';
        const serviceUrl = source.protocol + source.host;

        // tags
        const divTags = $$.visible<HTMLInputElement>('div[data-test-id=ticket-fields-tags]');
        let tagNames = [] as (string | null)[];

        if (divTags) {
            tagNames = $$.all('.garden-tag-item', divTags).map(_ => _.textContent);
        }

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }
}

IntegrationService.register(new Zendesk());