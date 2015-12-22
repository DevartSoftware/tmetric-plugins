module Integrations {

    class Assembla implements WebToolIntegration {

        observeMutations = true;

        integrateInIFrames = true;

        matchUrl = '*://www.assembla.com/spaces/*';

        issueElementSelector() {
            return $$.all('#tickets-show', $$.try<HTMLIFrameElement>('#popup_page iframe').contentDocument || document);
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.ticket-fields', issueElement);
            if (host) {
                var linkContainer = $$.create('div', 'mt-10');
                linkContainer.appendChild(linkElement);
                host.parentElement.insertBefore(linkContainer, host.nextElementSibling);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Full urls
            // https://www.assembla.com/spaces/WORKSPACE/tickets/TICKET_NUMBER-TICKET_NAME_DASHED_AND_LOWERCASED/details
            // https://www.assembla.com/spaces/WORKSPACE/simple_planner#/ticket:TICKET_NUMBER
            // https://www.assembla.com/spaces/WORKSPACE/tickets/new_cardwall#ticket:TICKET_NUMBER
            // https://www.assembla.com/spaces/WORKSPACE/tickets/agile_planner
            // Effective url
            // https://www.assembla.com/spaces/WORKSPACE/tickets/TICKET_NUMBER
            var match = /^\/spaces\/([^\/]+)\/.+$/.exec(source.path);
            if (!match) {
                return;
            }

            var issueId = $$.try('.ticket-info .ticket-number', issueElement).textContent;
            var issueIdNumber = issueId.replace(/^[^\d]*/, '');
            if (!issueId) {
                return;
            }

            var issueName =
                $$.try('.ticket-summary h1 span', issueElement).textContent || // full ticket view
                $$.try('#form-container .ticket-summary h1', issueElement).textContent; // dialog ticket view
            if (!issueName) {
                return;
            }

            var projectName =
                $$.try('h1.header-w > span').textContent || // old navigation
                $$.try('.navigation .nav-spaces .nav-item > a').textContent; // new navigation

            var serviceType = 'Assembla';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = 'spaces/' + match[1] + '/tickets/' + issueIdNumber;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Assembla());
}