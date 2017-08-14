module Integrations {

    class TaigaIntegration implements WebToolIntegration {

        observeMutations = true;

        showIssueId = true;

        matchUrl = /.+\/project\/.+\/(task|us|issue)\/(\d+)$/;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let host = $$('.sidebar.ticket-data');
            if (!host) {
                return;
            }

            let linkContainer = $$.create('section');
            linkContainer.appendChild(linkElement);
            host.insertBefore(linkContainer, host.firstElementChild);
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // https://taiga.some.server/project/PROJECT_NAME/task/NUMBER
            // https://taiga.some.server/project/PROJECT_NAME/us/NUMBER
            // https://taiga.some.server/project/PROJECT_NAME/issue/NUMBER
            let match = this.matchUrl.exec(source.fullUrl);

            // match[2] is a 'NUMBER' from path
            let issueId = '#' + match[2];

            let issueName = $$.try('.us-story-main-data .detail-subject').textContent;
            if (!issueName) {
                return;
            }

            let projectName = $$.try('.us-detail h1 > .project-name').textContent;

            let serviceType = 'Taiga';

            let serviceUrl = source.protocol + source.host;

            let issueUrl = source.path;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new TaigaIntegration());
}