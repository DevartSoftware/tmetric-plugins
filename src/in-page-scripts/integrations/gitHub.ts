class GitHub implements WebToolIntegration {

    showIssueId = true;

    matchUrl = [
        /(https:\/\/github\.com)(\/.+\/(issues|pull)\/(\d+))/, // classic view
        /(https:\/\/github\.com)\/.+[&\?]issue=([^&]+)/ // project view (TMET-10899)
    ];

    // GitHub may move some elements to an invisible area, in which case
    // the button needs to be moved to the new visible parent (TMET-10939)
    canBeRenderedRepeatedly = true;

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        linkElement.classList.add('mr-2'); // margin for edit button
        linkElement.classList.add('btn');
        linkElement.classList.add('btn-sm');

        const host = $$('.gh-header-actions');
        if (host) {
            host.insertBefore(linkElement, host.firstElementChild);
            return;
        }

        // project view
        const firstHeaderButton = $$.visible('div[data-testid=issue-header] button');
        if (firstHeaderButton) {
            firstHeaderButton.parentElement!.insertBefore(linkElement, firstHeaderButton);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const match = this.matchUrl[0].exec(source.fullUrl);
        if (!match) {
            return this.getProjectIssue(_issueElement, source);
        }

        const issueName = $$('[data-testid=issue-title]')?.textContent; // TMET-10938
        if (!issueName) {
            return;
        }

        // https://github.com/NAMESPACE/PROJECT/issues/NUMBER
        // https://github.com/NAMESPACE/PROJECT/pull/NUMBER
        const serviceUrl = match[1];
        const issueUrl = match[2];
        const issueType = match[3];
        let issueId = match[4];
        issueId = (issueType == 'pull' ? '!' : '#') + issueId

        const serviceType = 'GitHub';
        let projectName = $$.try('[itemprop=name]').textContent ||
            $$.try('.AppHeader-context-full nav li:last-of-type .AppHeader-context-item-label').textContent;
        const tagNames = $$.all('div[data-testid=issue-labels] > a > span:not(.sr-only):first-of-type')
            .map(label => label.textContent);

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }

    getProjectIssue(_issueElement: HTMLElement, source: Source) {

        let issueId: string | undefined;
        let issueUrl: string | undefined;
        const issueName = $$('[data-testid=issue-title]')?.textContent;
        if (!issueName) {
            return;
        }

        const match = this.matchUrl[1].exec(source.fullUrl)!;
        const serviceUrl = match[1];
        const issueParams = decodeURIComponent(match[2]).split('|'); // "MyNamespace|MyProject|123"
        if (issueParams.length === 3) {
            issueId = '#' + issueParams[2];
            issueUrl = ['', ...issueParams.slice(0, 2), 'issues', issueParams[2]]
                .map(s => encodeURIComponent(s))
                .join('/');
        }

        const serviceType = 'GitHub';
        const projectName = $$<HTMLAnchorElement>('.AppHeader-context-full ul > li a',
            null,
            el => !!el.href.match(/\/projects\/\d+$/))?.textContent;
        const tagNames = $$.all('div[data-testid=issue-labels] > a > span:not(.sr-only):first-of-type')
            .map(label => label.textContent);

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }
}

IntegrationService.register(new GitHub());