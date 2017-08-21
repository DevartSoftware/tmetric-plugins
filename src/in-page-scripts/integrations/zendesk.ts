module Integrations {

    class Zendesk implements WebToolIntegration {

        showIssueId = true;

        observeMutations = true;

        matchUrl = '*://*.zendesk.com/agent/tickets/*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            let host = $$.visible('header .pane.right');
            if (host) {
                linkElement.classList.add('btn', 'devart-timer-link-zendesk');
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueNameElement = $$.visible<HTMLInputElement>('.ticket .editable input[name=subject]');
            var issueName = issueNameElement && issueNameElement.value;
            if (!issueName) {
                return;
            }

            // Ticket url:
            // https://*.zendesk.com/agent/tickets/TICKET_ID
            var match = /^\/agent\/tickets\/(\d+)$/.exec(source.path);
            if (match) {
                var issueId = '#' + match[1];
                var serviceType = 'Zendesk';
                var serviceUrl = source.protocol + source.host;
                var issueUrl = source.path;
            }

            var projectName = ''; // zendesk have no predefined field for project

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Zendesk());
}