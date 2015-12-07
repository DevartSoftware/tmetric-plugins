module Integrations {

    class Bitbucket implements WebToolIntegration {

        observeMutations = true;

        matchUrl = [
            '*://*/issues/*',
            '*://*/pull-requests/*'
        ];

        match(source: Source): boolean {
            var appName = $$('meta[name=application-name]');
            if (appName) {
                return appName.getAttribute('content') == 'Bitbucket';
            }
            return false;
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

            var result;

            if (match) {

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
                issueName = issueName.trim();

                // <h1>
                //      <a href="/NAMESPACE/TRANSFORMED_PROJECT_NAME" title= "PROJECT_NAME" class="entity-name" >PROJECT_NAME</a>
                // </h1>

                var projectName = $$.try('.entity-name').textContent;

                var serviceType = 'Bitbucket';

                // match[1] is a 'https://bitbucket.org/NAMESPACE/TRANSFORMED_PROJECT_NAME' from path
                // cut '/NAMESPACE/TRANSFORMED_PROJECT_NAME' from path
                var servicePath = match[1].split('/').slice(0, -2).join('/');
                servicePath = (servicePath) ? '/' + servicePath : '';

                var serviceUrl = source.protocol + source.host + servicePath;

                var issueUrl = match[1].split('/').slice(-2).join('/') + '/' + issueType + '/' + issueNumber;

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
            }

            return result;
        }
    }

    IntegrationService.register(new Bitbucket());
}