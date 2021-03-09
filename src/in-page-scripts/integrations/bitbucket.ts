class Bitbucket implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = [
        '*://*/issues/*',
        '*://*/pull-requests/*'
    ];

    match() {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'Bitbucket';
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const issueHeader = $$('#issue-header');
        const pullRequestHeader = $$('#pull-request-header');

        let actionContainer: HTMLElement;
        if (issueHeader) {
            actionContainer = $$('.issue-toolbar', issueHeader);
        } else if (pullRequestHeader) {
            actionContainer = $$('#pullrequest-actions', pullRequestHeader);
        }

        if (actionContainer) {
            const linkContainer = $$.create('div', 'devart-timer-link-bitbucket', 'aui-buttons')
            linkElement.classList.add('aui-button');
            linkContainer.appendChild(linkElement);
            actionContainer.insertBefore(linkContainer, actionContainer.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

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

        let issueId: string, issueName: string;
        const issueType = match[2];
        if (issueType == 'issues') {
            issueId = '#' + issueNumber;

            // <h1 id="issue-title">ISSUE_NAME</h1>
            issueName = $$.try('#issue-title').textContent;
        } else if (issueType == 'pull-requests') {
            issueId = '!' + issueNumber;

            // <span class="pull-request-title">
            //      PULL_REQUEST_NAME
            // </span>
            issueName = $$.try('.pull-request-title').textContent;
        }

        if (!issueName) {
            return;
        }

        // <li class="aui-nav-selected" >
        //   <a href="/account/user/almtoolsteam/projects/CR" > Code Review< /a>
        // </li>
        const projectName = $$.try(
            '.aui-nav-selected a',
            null,
            el => /.+\/projects\/.+/.test(el.getAttribute('href'))
        ).textContent;

        const serviceType = 'Bitbucket';

        // match[1] is a 'https://bitbucket.org/NAMESPACE/TRANSFORMED_PROJECT_NAME' from path
        // cut '/NAMESPACE/TRANSFORMED_PROJECT_NAME' from path
        let servicePath = match[1].split('/').slice(0, -2).join('/');
        servicePath = (servicePath) ? '/' + servicePath : '';

        const serviceUrl = source.protocol + source.host + servicePath;

        const issueUrl = match[1].split('/').slice(-2).join('/') + '/' + issueType + '/' + issueNumber;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Bitbucket());