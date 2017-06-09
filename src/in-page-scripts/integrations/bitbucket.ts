module Integrations {

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
            var issueHeader = $$('#issue-header');
            var pullRequestHeader = $$('#pull-request-header');

            var actionContainer: HTMLElement;
            if (issueHeader) {
                actionContainer = $$('.issue-toolbar', issueHeader);
            } else if (pullRequestHeader) {
                actionContainer = $$('#pullrequest-actions', pullRequestHeader);
            }

            if (actionContainer) {
                var linkContainer = $$.create('div', 'devart-timer-link-bitbucket')
                linkContainer.classList.add('aui-buttons');
                linkElement.classList.add('aui-button');
                linkContainer.appendChild(linkElement);
                actionContainer.insertBefore(linkContainer, actionContainer.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // https://bitbucket.org/NAMESPACE/TRANSFORMED_PROJECT_NAME/issues/NUMBER/TRANSFORMED_ISSUE_NAME
            // https://bitbucket.org/NAMESPACE/TRANSFORMED_PROJECT_NAME/pull-requests/NUMBER/TRANSFORMED_PULL_REQUEST_NAME/VIEW
            var match = /^(.+)\/(issues|pull-requests)\/(\d+).*$/.exec(source.path);

            if (!match) {
                return;
            }

            // match[3] is a 'NUMBER' from path
            var issueNumber = match[3];
            if (!issueNumber) {
                return;
            }

            var issueId: string, issueName: string;
            var issueType = match[2];
            if (issueType == 'issues') {
                issueId = '#' + issueNumber;

                // <h1 id="issue-title">ISSUE_NAME</h1>
                issueName = $$.try('#issue-title').textContent;
            } else if (issueType == 'pull-requests') {
                issueId = '!' + issueNumber;

                // <div class="pull-request-title">
                //      <h1>
                //          PULL_REQUEST_NAME
                //      </h1>
                // </div>
                issueName = $$.try('.pull-request-title h1').textContent;
            }

            if (!issueName) {
                return;
            }

            // <li class="aui-nav-selected" >
            //   <a href="/account/user/almtoolsteam/projects/CR" > Code Review< /a>
            // </li>
            var projectName = $$.try(
                '.aui-page-panel .aui-nav-selected a',
                null,
                el => /.+\/projects\/.+/.test(el.getAttribute('href'))
            ).textContent;

            var serviceType = 'Bitbucket';

            // match[1] is a 'https://bitbucket.org/NAMESPACE/TRANSFORMED_PROJECT_NAME' from path
            // cut '/NAMESPACE/TRANSFORMED_PROJECT_NAME' from path
            var servicePath = match[1].split('/').slice(0, -2).join('/');
            servicePath = (servicePath) ? '/' + servicePath : '';

            var serviceUrl = source.protocol + source.host + servicePath;

            var issueUrl = match[1].split('/').slice(-2).join('/') + '/' + issueType + '/' + issueNumber;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Bitbucket());
}