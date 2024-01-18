class Sprintly implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://sprint.ly/*';

    issueElementSelector = '.card';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // Add link to actions if card opens in single mode
        if ($$.closest('#product-item-view', issueElement)) {
            const host = $$('.actions .buttons', issueElement);
            if (host) {
                host.appendChild(linkElement);
                return;
            }
        }

        // Add link to menu otherwise
        const host = $$('.settings .popup ul', issueElement);
        if (host) {
            const li = $$.create('li', 'devart-timer-link-sprintly');
            li.appendChild(linkElement);
            host.insertBefore(li, host.firstChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const issueName = $$.try('.title', issueElement).textContent;
        if (!issueName) {
            return;
        }

        let projectUrl: string | null | undefined;
        const projectNameElement = $$('a.products');
        let projectName: string | null | undefined;
        if (projectNameElement) {
            projectName = projectNameElement.textContent;
            projectUrl = projectNameElement.getAttribute('href');
        }

        const serviceType = 'Sprintly';
        const serviceUrl = source.protocol + source.host;

        const issueNumberElement = $$('.number .value', issueElement);
        let issueId: string | undefined | null;
        let issueUrl: string | undefined | null;
        if (issueNumberElement) {
            issueId = issueNumberElement.textContent;
            if (projectUrl) {
                const match = /^([^\d]*)(\d+)$/.exec(issueNumberElement.textContent || '');
                if (match) {
                    issueUrl = projectUrl + 'item/' + match[2];
                }
            }
        }

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl } as WebToolIssue;
    }
}

IntegrationService.register(new Sprintly());