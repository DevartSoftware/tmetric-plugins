class Assembla implements WebToolIntegration {

    showIssueId = true;

    // Urls:
    // https://[www|PORTFOLIO].assembla.com/spaces/*
    matchUrl = '*://*.assembla.com/spaces/*';

    issueElementSelector = () => [$$('.v4-ticket-details') || $$('#tickets-show') || $$('#ticketDetailsContainer')];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('.ticket-fields', issueElement);
        if (host) {
            const linkContainer = $$.create('div', 'devart-timer-link-assembla');
            linkContainer.appendChild(linkElement);
            host.parentElement!.insertBefore(linkContainer, host.nextElementSibling);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        // Full urls
        // https://[www|PORTFOLIO].assembla.com/spaces/WORKSPACE/tickets/TICKET_NUMBER-TICKET_NAME_DASHED_AND_LOWERCASED/details
        // https://[www|PORTFOLIO].assembla.com/spaces/WORKSPACE/simple_planner#/ticket:TICKET_NUMBER
        // https://[www|PORTFOLIO].assembla.com/spaces/WORKSPACE/tickets/new_cardwall#ticket:TICKET_NUMBER
        // https://[www|PORTFOLIO].assembla.com/spaces/WORKSPACE/tickets/agile_planner
        // Effective url
        // https://www.assembla.com/spaces/WORKSPACE/tickets/TICKET_NUMBER
        const match = /^\/spaces\/([^\/]+)\/.+$/.exec(source.path);
        if (!match) {
            return;
        }

        const issue = $$.getAttribute('h1 > .zeroclipboard', 'data-clipboard-text', issueElement); // new design with react

        const issueId =
            issue.split(' - ')[0] || // ticket view
            $$.try('.ticket-info .ticket-number', issueElement).textContent; // planner ticket dialog view
        if (!issueId) {
            return;
        }

        const issueName =
            issue.split(' - ').slice(1).join(' - ') || // ticket view
            $$.try('#form-container .ticket-summary h1', issueElement).textContent; // planner ticket dialog view
        if (!issueName) {
            return;
        }

        const projectName =
            $$.try('h1.header-w > span').textContent || // old navigation
            $$.try('.navigation .nav-spaces .nav-item > a').textContent; // new navigation

        const serviceType = 'Assembla';

        // used www instead of portfolio name to prevent task duplication
        const serviceUrl = source.protocol + 'www.assembla.com';

        const issueUrl = 'spaces/' + match[1] + '/tickets/' + issueId.replace(/^[^\d]*/, '');

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Assembla());