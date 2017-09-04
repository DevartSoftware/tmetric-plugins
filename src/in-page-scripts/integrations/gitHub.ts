module Integrations {

    class GitHub implements WebToolIntegration {

        showIssueId = true;

        observeMutations = true;

        matchUrl = /https:\/\/github.com\/.+\/(issues|pull)\/(\d+)/

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            let host = $$('.gh-header-actions');
            if (host) {
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

            // https://github.com/NAMESPACE/PROJECT/issues/NUMBER
            // https://github.com/NAMESPACE/PROJECT/pull/NUMBER
            let match = this.matchUrl.exec(source.fullUrl);

            // match[2] is a 'NUMBER' from path
            let issueType = match[1];
            let issueId = match[2];
            issueId = (issueType == 'pull' ? '!' : '#') + issueId

            let projectName = $$.try('.repohead-details-container > h1 > strong > a').textContent;
            let serviceType = 'GitHub';
            let serviceUrl = source.protocol + source.host;
            let issueUrl = source.path;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new GitHub());
}