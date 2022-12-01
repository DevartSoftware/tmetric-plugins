class Sprintly implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

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

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.title', issueElement).textContent;
        if (!issueName) {
            return;
        }

        let projectNameElement = $$('a.products');
        if (projectNameElement) {
            var projectName = projectNameElement.textContent;
            var projectUrl = projectNameElement.getAttribute('href');
        }

        let serviceType = 'Sprintly';
        let serviceUrl = source.protocol + source.host;

        let issueNumberElement = $$('.number .value', issueElement);
        if (issueNumberElement) {
            var issueId = issueNumberElement.textContent;
            if (projectUrl) {
                var match = /^([^\d]*)(\d+)$/.exec(issueNumberElement.textContent);
                if (match) {
                    var issueUrl = projectUrl + 'item/' + match[2];
                }
            }
        }

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Sprintly());