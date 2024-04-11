class UserVoiceTicket implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://*.uservoice.com/*/tickets/*';

    issueElementSelector = '.ticket';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {
        const ticketAnchor = $$('.actionbar-item.stretch');
        if (ticketAnchor) {
            const linkContainer = $$.create('div', 'actionbar-item');
            linkElement.classList.add('button', 'secondary', 'small', 'actionbar-link');
            linkContainer.appendChild(linkElement);
            ticketAnchor.parentNode!.insertBefore(linkContainer, ticketAnchor.nextElementSibling);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        // https://*.uservoice.com/admin/tickets/TICKET_ID
        // https://*.uservoice.com/admin/tickets/TICKET_ID/?QUERY

        const issueName = $$.try<HTMLElement>('.ticket-subject-header', issueElement).textContent;
        if (!issueName) {
            return;
        }

        const serviceType = 'UserVoice';
        const serviceUrl = source.protocol + source.host;

        // Issue id in url not refreshed after creating new ticket.
        // Take it from ticket field.
        const issueUrlElement = $$.try<HTMLAnchorElement>('.ticket-metadata a[href*="/tickets/"]', issueElement);
        const match = /^(.+\/tickets\/)(\d+).*$/.exec(issueUrlElement?.href!);

        let issueId: string | undefined;
        let issueUrl: string | undefined;
        if (match) {
            issueId = '#' + match[2];
            issueUrl = $$.getRelativeUrl(serviceUrl, issueUrlElement?.href!);
        }

        const projectName = ''; // uservoice have no predefined field for project

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

class UserVoiceSuggestion implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://*.uservoice.com/*/suggestions/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const suggestionAnchor = $$('.page-header-title:not(.inline)');
        if (suggestionAnchor) {
            const linkContainer = $$.create('div', 'pull-right');
            linkElement.classList.add('button', 'secondary');
            linkContainer.appendChild(linkElement);
            suggestionAnchor.parentNode!.insertBefore(linkContainer, suggestionAnchor);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        // Suggestion url:
        // https://*.uservoice.com/admin/v3/suggestions/SUGGESTION_ID/SUBPATH
        const match = /^(\/.+\/suggestions\/)(\d+).*$/.exec(source.path);
        if (!match) {
            return;
        }

        const lastChild = $$.try('.page-header-title:not(.inline)').lastChild;
        const issueName = lastChild?.textContent?.trim();
        if (!issueName) {
            return;
        }

        const issueId = '#' + match[2];
        const serviceType = 'UserVoice';
        const serviceUrl = source.protocol + source.host;
        const issueUrl = match[1] + match[2];
        const projectName = ''; // uservoice have no predefined field for project

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new UserVoiceTicket());
IntegrationService.register(new UserVoiceSuggestion());