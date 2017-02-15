module Integrations {

    class Freshdesk implements WebToolIntegration {

        matchUrl = '*.freshdesk.com/helpdesk/tickets/*';

        observeMutations = true;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            var host = $$('.ticket-actions > ul');
            if (host) {

                linkElement.classList.add('btn');

                var containerLi = $$.create('li', 'ticket-btns');
                containerLi.appendChild(linkElement);
                host.appendChild(containerLi);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            if (!$$('.ticket-actions')) {
                return;
            }

            //https://company.freshdesk.com/helpdesk/tickets/1
            var issueName = $$.try('.subject').textContent.trim();
            if (!issueName) {
                return;
            }

            var issueId = $$('#ticket-display-id').textContent;
            var serviceUrl = source.protocol + source.host;
            var issueUrl = source.path;

            var product = $$('.default_product .select2-chosen');
            if (product == null) {
                return;
            }

            var projectName = product.textContent;
            
            if (projectName === '...') {
                projectName = "";
            }

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Freshdesk' };
        }
    }

    IntegrationService.register(new Freshdesk());
}


