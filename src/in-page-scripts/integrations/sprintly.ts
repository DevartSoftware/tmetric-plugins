class Sprintly implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://sprint.ly/*';

    issueElementSelector = '.card';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // Add link to actions if card opens in single mode
        if ($$.closest('#product-item-view', issueElement)) {
            let host = $$('.actions .buttons', issueElement);
            if (host) {
                host.appendChild(linkElement);
                return;
            }
        }

        // Add link to menu otherwise
        let host = $$('.settings .popup ul', issueElement);
        if (host) {
            let li = $$.create('li', 'devart-timer-link-sprintly');
            li.appendChild(linkElement);
            host.insertBefore(li, host.firstChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueName = $$.try('.title', issueElement).textContent;
        if (!issueName) {
            return;
        }

        let projectUrl: string | null | undefined;
        let projectNameElement = $$('a.products');
        let projectName: string | null | undefined;
        if (projectNameElement) {
            projectName = projectNameElement.textContent;
            projectUrl = projectNameElement.getAttribute('href');
        }

        let serviceType = 'Sprintly';
        let serviceUrl = source.protocol + source.host;

        let issueNumberElement = $$('.number .value', issueElement);
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