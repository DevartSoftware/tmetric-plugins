module Integrations {

    class PodioTask implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://podio.com/tasks/*';

        observeMutations = true;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let taskHeader = $$('.task-header .action-bar ul');
            if (taskHeader) {
                let container = $$.create('li');
                container.classList.add('float-left', 'devart-timer-link-podio');
                container.appendChild(linkElement);
            }
        }
        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueId: string;
            let matches = source.path.match(/(\/tasks\/\d+)/);
            if (matches) {
                issueId = matches[1];
            }

            let issueName = $$.try('.task-title > .header-title').textContent;

            var serviceUrl = source.protocol + source.host;
            var issueUrl = source.fullUrl.match(/\/tasks\/\d+/)[0];
            var projectName = null;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'PodioTask' };
        }
    }

    IntegrationService.register(new PodioTask());
}