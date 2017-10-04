class Freshdesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*.freshdesk.com/helpdesk/tickets/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        var host = $$('.ticket-actions > ul');
        if (host) {

            linkElement.classList.add('btn');

            var container = $$.create('li', 'ticket-btns');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        //https://company.freshdesk.com/helpdesk/tickets/1
        var issueName = $$.try('.subject').textContent;

        var issueId = $$.try('#ticket-display-id').textContent;
        var serviceUrl = source.protocol + source.host;
        var issueUrl = source.path;

        var projectName = $$.try('.default_product .select2-chosen').textContent;

        if (projectName === '...') {
            projectName = "";
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Freshdesk' };
    }
}

IntegrationService.register(new Freshdesk());