class Bitbucket implements WebToolIntegration {

    showIssueId = true;

    // https://bitbucket.org/WORKSPACE/REPO/issues/123
    // https://bitbucket.org/WORKSPACE/REPO/pull-requests/123
    // https://bitbucket.org/WORKSPACE/REPO/commits/abcdef123456abcdef123456abcdef12345abcde
    matchUrl = /^([^:]+:\/\/[^\/]+)(.+)\/(issues|pull-requests|commits)\/([^\/\?]+)/;

    match() {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'Bitbucket';
    }

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const issueToolbar = $$('#issue-header .issue-toolbar');
        if (issueToolbar) {
            const linkContainer = $$.create('div', 'aui-buttons')
            linkElement.classList.add('aui-button');
            linkElement.style.marginRight = '10px'
            linkContainer.appendChild(linkElement);
            issueToolbar.insertBefore(linkContainer, issueToolbar.firstElementChild);
            return;
        }

        const toolbar =
            $$('main [data-qa=pr-header-actions-drop-down-menu-styles]')?.parentElement || // pull request actions
            $$('button[data-testid="commit-more-button--trigger"]')?.parentElement; // commit actions
        if (toolbar) {
            Object.assign(linkElement.style, {
                marginRight: '6px',
                marginTop: '6px'
            } as CSSStyleDeclaration);
            toolbar.prepend(linkElement);
            return;
        }

        let fallbackHeading = $$('main h1');
        if (fallbackHeading) {
            fallbackHeading.parentElement!.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const match = this.matchUrl.exec(source.fullUrl);
        if (!match) {
            return;
        }

        // '', 'https: //bitbucket.org' '/WORKSPACE/REPO', 'pull-requests', '123'
        let [, serviceUrl, repoPath, issueType, issueNumber] = match;

        if (issueType == 'commits') {

            // issueNumber is commit hash
            issueNumber = issueNumber.toLowerCase();
            if (/[^a-f0-9]/.test(issueNumber)) {
                return;
            }

            // https://bitbucket.org/WORKSPACE/REPO/src/abcdef123456abcdef123456abcdef12345abcde/
            const hrefPattern = `/src/${issueNumber}`;
            const href = $$<HTMLAnchorElement>(`a[href*="${hrefPattern}"]`)?.href;
            if (href) {
                const i = href.indexOf(hrefPattern);
                issueNumber = href!.substring(i).match(/\/src\/([a-f0-9]+)/)![1];
            }
        } else if (/\D/.test(issueNumber)) {
            return;
        }

        const issueUrl = `${repoPath}/${issueType}/${issueNumber}`;

        let issueId: string | undefined;
        let issueName: string | undefined | null;

        if (issueType == 'issues') {
            issueId = '#' + issueNumber;
            issueName = $$.try('#issue-title').textContent;
        } else if (issueType == 'pull-requests') {
            issueId = '!' + issueNumber;
            issueName = $$.try('main h1').textContent;
        } else if (issueType == 'commits') {
            issueId = issueNumber.substring(0, 7);
            issueName = 'Commit ' + issueNumber.substring(0, 12);
        }

        if (!issueName) {
            return;
        }

        // <a href="/account/user/almtoolsteam/projects/CR">Code Review</a>
        const projectName = $$.try(
            'main nav a',
            null,
            el => /.+\/projects\/.+/.test(el.getAttribute('href')!)
        ).textContent;

        const serviceType = 'Bitbucket';
        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Bitbucket());