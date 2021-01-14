class GitHub implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = /(https:\/\/github\.com)(\/.+\/(issues|pull)\/(\d+))/

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('.gh-header-actions');
        if (host) {
            linkElement.style.display = 'inline-block'; // ZenHub hides action links by default
            linkElement.classList.add('mr-2'); // margin for edit button
            linkElement.classList.add('btn');
            linkElement.classList.add('btn-sm');
            host.insertBefore(linkElement, host.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueName = $$.try('.js-issue-title').textContent;
        if (!issueName) {
            return;
        }

        const projectName = $$.try('[itemprop=name]').textContent;

        // https://github.com/NAMESPACE/PROJECT/issues/NUMBER
        // https://github.com/NAMESPACE/PROJECT/pull/NUMBER
        const match = this.matchUrl.exec(source.fullUrl);
        const serviceUrl = match[1];
        const issueUrl = match[2];
        const issueType = match[3];
        let issueId = match[4];
        issueId = (issueType == 'pull' ? '!' : '#') + issueId
        const serviceType = 'GitHub';
        const tagNames = $$.all('.sidebar-labels .IssueLabel').map(label => label.textContent);

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new GitHub());
