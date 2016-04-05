module Integrations {

    class Assembla implements WebToolIntegration {

        observeMutations = true;

        // Urls:
        // https://[www|PORTFOLIO].assembla.com/spaces/*
        matchUrl = '*://*.assembla.com/spaces/*';

        issueElementSelector = () => [$$('.v4-ticket-details') || $$('#tickets-show')];

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.ticket-fields', issueElement);
            if (host) {
                var linkContainer = $$.create('div', 'devart-timer-link-assembla');
                linkContainer.appendChild(linkElement);
                host.parentElement.insertBefore(linkContainer, host.nextElementSibling);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Full urls
            // https://[www|PORTFOLIO].assembla.com/spaces/WORKSPACE/tickets/TICKET_NUMBER-TICKET_NAME_DASHED_AND_LOWERCASED/details
            // https://[www|PORTFOLIO].assembla.com/spaces/WORKSPACE/simple_planner#/ticket:TICKET_NUMBER
            // https://[www|PORTFOLIO].assembla.com/spaces/WORKSPACE/tickets/new_cardwall#ticket:TICKET_NUMBER
            // https://[www|PORTFOLIO].assembla.com/spaces/WORKSPACE/tickets/agile_planner
            // Effective url
            // https://www.assembla.com/spaces/WORKSPACE/tickets/TICKET_NUMBER
            var match = /^\/spaces\/([^\/]+)\/.+$/.exec(source.path);
            if (!match) {
                return;
            }

            var issueId =
                $$.try('strong[data-reactid="' + (issueElement && issueElement.dataset['reactid'])  + '.0.0.0.1"]', issueElement).textContent || // ticket view
                $$.try('.ticket-info .ticket-number', issueElement).textContent; // planner ticket dialog view
            if (!issueId) {
                return;
            }

            var issueName =
                $$.try('span[data-reactid="' + (issueElement && issueElement.dataset['reactid'])  + '.0.1.0.0.0"]', issueElement).textContent || // ticket view
                $$.try('#form-container .ticket-summary h1', issueElement).textContent; // planner ticket dialog view
            if (!issueName) {
                return;
            }

            var projectName =
                $$.try('h1.header-w > span').textContent || // old navigation
                $$.try('.navigation .nav-spaces .nav-item > a').textContent; // new navigation

            var serviceType = 'Assembla';

            // used www instead of portfolio name to prevent task duplication
            var serviceUrl = source.protocol + 'www.assembla.com';

            var issueUrl = 'spaces/' + match[1] + '/tickets/' + issueId.replace(/^[^\d]*/, '');

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Assembla());
}