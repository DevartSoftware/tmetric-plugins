module Integrations {

    class GitHub implements WebToolIntegration {

        showIssueId = true;

        observeMutations = true;

        matchUrl = /(https:\/\/github\.com)(\/.+\/(issues|pull)\/(\d+))/

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            let host = $$('.gh-header-actions');
            if (host) {
                linkElement.style.display = 'inline-block'; // ZenHub hides action links by default
                linkElement.classList.add('github');
                linkElement.classList.add('btn');
                linkElement.classList.add('btn-sm');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.js-issue-title').textContent;
            if (!issueName) {
                return;
            }

            let projectName = $$.try('.repohead-details-container > h1 > strong > a').textContent;

            // https://github.com/NAMESPACE/PROJECT/issues/NUMBER
            // https://github.com/NAMESPACE/PROJECT/pull/NUMBER
            let match = this.matchUrl.exec(source.fullUrl);
            let serviceUrl = match[1];
            let issueUrl = match[2];
            let issueType = match[3];
            let issueId = match[4];
            issueId = (issueType == 'pull' ? '!' : '#') + issueId
            let serviceType = 'GitHub';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new GitHub());
}