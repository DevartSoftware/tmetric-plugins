class Bitbucket implements WebToolIntegration {

    showIssueId = true;

    matchUrl = [
        '*://*/issues/*',
        '*://*/pull-requests/*'
    ];

    match() {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'Bitbucket';
    }

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const issueToolbar = $$('#issue-header .issue-toolbar');
        if (issueToolbar) {
            const linkContainer = $$.create('div', 'devart-timer-link-bitbucket', 'aui-buttons')
            linkElement.classList.add('aui-button');
            linkContainer.appendChild(linkElement);
            issueToolbar.insertBefore(linkContainer, issueToolbar.firstElementChild);
            return;
        }

        const pullRequestActionPanel = $$('main [data-qa=pr-header-actions-drop-down-menu-styles]')?.parentElement;
        if (pullRequestActionPanel) {
            linkElement.style.marginTop = '6px';
            pullRequestActionPanel.prepend(linkElement);
            return;
        }

        let pullRequestHeading = $$('main h1');
        if (pullRequestHeading) {
            pullRequestHeading.parentElement!.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        // https://bitbucket.org/NAMESPACE/TRANSFORMED_PROJECT_NAME/issues/NUMBER/TRANSFORMED_ISSUE_NAME
        // https://bitbucket.org/NAMESPACE/TRANSFORMED_PROJECT_NAME/pull-requests/NUMBER/TRANSFORMED_PULL_REQUEST_NAME/VIEW
        const match = /^(.+)\/(issues|pull-requests)\/(\d+).*$/.exec(source.path);

        if (!match) {
            return;
        }

        // match[3] is a 'NUMBER' from path
        const issueNumber = match[3];
        if (!issueNumber) {
            return;
        }

        let issueId: string | undefined;
        let issueName: string | undefined | null;

        const issueType = match[2];
        if (issueType == 'issues') {
            issueId = '#' + issueNumber;

            // <h1 id="issue-title">ISSUE_NAME</h1>
            issueName = $$.try('#issue-title').textContent;
        } else if (issueType == 'pull-requests') {
            issueId = '!' + issueNumber;

            // <h1 class="...">
            //     PULL_REQUEST_NAME
            // </span>
            issueName = $$.try('h1').textContent;
        }

        if (!issueName) {
            return;
        }

        // <a href="/account/user/almtoolsteam/projects/CR">Code Review</a>
        const projectName = $$.try(
            '.aui-nav-breadcrumbs a, header a',
            null,
            el => /.+\/projects\/.+/.test(el.getAttribute('href')!)
        ).textContent;

        const serviceType = 'Bitbucket';

        // match[1] is a 'https://bitbucket.org/NAMESPACE/TRANSFORMED_PROJECT_NAME' from path
        // cut '/NAMESPACE/TRANSFORMED_PROJECT_NAME' from path
        let servicePath = match[1].split('/').slice(0, -2).join('/');
        servicePath = (servicePath) ? '/' + servicePath : '';

        const serviceUrl = source.protocol + source.host + servicePath;

        const issueUrl = match[1].split('/').slice(-2).join('/') + '/' + issueType + '/' + issueNumber;

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Bitbucket());