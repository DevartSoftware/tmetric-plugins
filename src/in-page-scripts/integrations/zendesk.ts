module Integrations {

    class Zendesk implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*.zendesk.com/agent/tickets/*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var workspace = $$.visible('.workspace');
            if (!workspace) {
                return;
            }

            var host = $$('.property_box_container', workspace);
            if (host) {
                linkElement.classList.add('btn');
                var linkContainer = $$.create('div', 'devart-timer-link-zendesk');
                linkContainer.classList.add('property_box');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            var workspace = $$.visible('.workspace');
            if (!workspace) {
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

            var issueName = $$.try<HTMLInputElement>('input[name=subject]', workspace).value;
            if (!issueName) {
                return;
            }

            var projectName = ''; // zendesk have no predefined field for project

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Zendesk());
}