module Integrations {

    class Uservoice implements WebToolIntegration {

        observeMutations = true;

        matchUrl = [
            '*://*.uservoice.com/*/tickets/*',
            '*://*.uservoice.com/*/suggestions/*'
        ];

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            // ticket
            var ticketAnchor = $$('.actionbar-item.stretch');

            // suggestion
            var suggestionAnchor = $$('.page-header-title:not(.inline)');

            if (ticketAnchor) {
                var linkContainer = $$.create('div', 'actionbar-item');
                linkElement.classList.add('button', 'secondary', 'small', 'actionbar-link');
                linkContainer.appendChild(linkElement);
                ticketAnchor.parentNode.insertBefore(linkContainer, ticketAnchor.nextElementSibling);
            } else if (suggestionAnchor) {
                var linkContainer = $$.create('div', 'pull-right');
                linkElement.classList.add('button', 'secondary');
                linkContainer.appendChild(linkElement);
                suggestionAnchor.parentNode.insertBefore(linkContainer, suggestionAnchor);
            }

        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Ticket url:
            // https://*.uservoice.com/admin/tickets/TICKET_ID
            // https://*.uservoice.com/admin/tickets/TICKET_ID/?QUERY
            var ticketMatch = /^(\/.+\/tickets\/)(\d+).*$/.exec(source.path);

            // Suggestion url:
            // https://*.uservoice.com/admin/v3/suggestions/SUGGESTION_ID/SUBPATH
            var suggestionMatch = /^(\/.+\/suggestions\/)(\d+).*$/.exec(source.path);

            if (ticketMatch) {
                var match = ticketMatch;
                var issueName = $$.try<HTMLElement>('.ticket-subject-header').textContent;    
            } else if (suggestionMatch) {
                var match = suggestionMatch;
                var lastChild = $$.try('.page-header-title:not(.inline)').lastChild;
                var issueName = lastChild && lastChild.textContent.trim();
            }
            
            if (!issueName) {
                return;
            }

            if (match) {
                var issueId = '#' + match[2];
                var serviceType = 'Uservoice';
                var serviceUrl = source.protocol + source.host;
                var issueUrl = match[1] + match[2];
            }

            var projectName = ''; // uservoice have no predefined field for project

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Uservoice());
}