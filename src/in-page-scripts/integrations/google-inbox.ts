class GoogleInbox implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://inbox.google.com*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let toolbar = $$('.bJ .iK');
        if (toolbar) {
            let menuItem = $$.create('li', 'action', 'devart-timer-link-inbox');
            menuItem.appendChild(linkElement);
            toolbar.insertBefore(menuItem, toolbar.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.eo > span').textContent;
        if (!issueName) {
            return;
        }

        let issueUrl: string;
        let issueId: string;

        let matches = source.fullUrl.match(/\/document\/d\/([a-zA-Z0-9\-]+)\/edit/);

        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'GoogleInbox' };
    }
}

IntegrationService.register(new GoogleInbox());