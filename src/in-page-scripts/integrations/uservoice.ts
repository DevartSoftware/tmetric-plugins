module Integrations {

    class UservoiceTicket implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*.uservoice.com/*/tickets/*';

        issueElementSelector = '.ticket';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var ticketAnchor = $$('.actionbar-item.stretch');
            if (ticketAnchor) {
                var linkContainer = $$.create('div', 'actionbar-item');
                linkElement.classList.add('button', 'secondary', 'small', 'actionbar-link');
                linkContainer.appendChild(linkElement);
                ticketAnchor.parentNode.insertBefore(linkContainer, ticketAnchor.nextElementSibling);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // https://*.uservoice.com/admin/tickets/TICKET_ID
            // https://*.uservoice.com/admin/tickets/TICKET_ID/?QUERY

            var issueName = $$.try<HTMLElement>('.ticket-subject-header', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var serviceType = 'UserVoice';
            var serviceUrl = source.protocol + source.host;

            // Issue id in url not refreshed after creating new ticket.
            // Take it from ticket field.
            var issueUrlElement = $$.try<HTMLAnchorElement>('.ticket-metadata a[href*="/tickets/"]', issueElement);
            var match = /^(.+\/tickets\/)(\d+).*$/.exec(issueUrlElement.href);
            if (match) {
                var issueId = '#' + match[2];
                var issueUrl = $$.getRelativeUrl(serviceUrl, issueUrlElement.href);
            }

            var projectName = ''; // uservoice have no predefined field for project

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    class UservoiceSuggestion implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*.uservoice.com/*/suggestions/*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            var suggestionAnchor = $$('.page-header-title:not(.inline)');
            if (suggestionAnchor) {
                var linkContainer = $$.create('div', 'pull-right');
                linkElement.classList.add('button', 'secondary');
                linkContainer.appendChild(linkElement);
                suggestionAnchor.parentNode.insertBefore(linkContainer, suggestionAnchor);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Suggestion url:
            // https://*.uservoice.com/admin/v3/suggestions/SUGGESTION_ID/SUBPATH
            var match = /^(\/.+\/suggestions\/)(\d+).*$/.exec(source.path);
            if (!match) {
                return;
            }

            var lastChild = $$.try('.page-header-title:not(.inline)').lastChild;
            var issueName = lastChild && lastChild.textContent.trim();
            if (!issueName) {
                return;
            }

            var issueId = '#' + match[2];
            var serviceType = 'Uservoice';
            var serviceUrl = source.protocol + source.host;
            var issueUrl = match[1] + match[2];
            var projectName = ''; // uservoice have no predefined field for project

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new UservoiceTicket());
    IntegrationService.register(new UservoiceSuggestion());
}