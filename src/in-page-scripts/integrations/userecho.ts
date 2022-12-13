class Userecho implements WebToolIntegration {

    showIssueId = false;

    observeMutations = false;

    matchUrl = 'https://*.userecho.com/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('.topic-actions-panel');

        if (host) {
            let container = $$.create('li');
            container.appendChild(linkElement);
            host.insertBefore(container, host.firstChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issue = $$.try('.topic-header a');
        let issueName = issue.textContent;
        let issueHref = issue.getAttribute('href');

        // /communities/1/topics/1-good-an-idea
        // /knowledge-bases/2/articles/3-how-it-works
        // /helpdesks/3/tickets/4-change-status
        let match = /^(\/[^\/]+\/\d+\/[^\/]+\/(\d+)-)/.exec(issueHref);
        if (!issueName || !match) {
            return;
        }

        let issueUrl = match[1];
        let issueId = match[2];
        let serviceUrl = source.protocol + source.host;
        let projectName = $$.try('.navbar-brand').textContent;

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Userecho' };
    }
}

IntegrationService.register(new Userecho());