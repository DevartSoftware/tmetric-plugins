class Userecho implements WebToolIntegration {

    showIssueId = false;

    observeMutations = false;

    matchUrl = 'https://*.userecho.com/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('.topic-actions-panel');

        if (host) {
            let container = $$.create('li');
            container.appendChild(linkElement);
            host.insertBefore(container, host.firstChild);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        let issue = $$('.topic-header a');
        if (!issue) {
            return;
        }

        let issueName = issue.textContent;
        if (!issueName) {
            return;
        }

        let issueHref = issue.getAttribute('href');

        // /communities/1/topics/1-good-an-idea
        // /knowledge-bases/2/articles/3-how-it-works
        // /helpdesks/3/tickets/4-change-status
        let match = /^(\/[^\/]+\/\d+\/[^\/]+\/(\d+)-)/.exec(issueHref!);
        if (!match) {
            return;
        }

        const issueUrl = match[1];
        const issueId = match[2];
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Userecho';
        const projectName = $$.try('.navbar-brand').textContent;

        return {
            issueId, issueName, issueUrl, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new Userecho());