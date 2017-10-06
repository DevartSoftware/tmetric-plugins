class GoogleInbox implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://inbox.google.com*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let toolbar = $$('.bJ .iK');
        if (toolbar) {
            let menuItem = $$.create('li', 'action', 'devart-timer-link-google-inbox');
            menuItem.appendChild(linkElement);
            toolbar.insertBefore(menuItem, toolbar.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.eo > span').textContent;

        return { issueName };
    }
}

IntegrationService.register(new GoogleInbox());