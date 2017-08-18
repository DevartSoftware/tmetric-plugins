module Integrations {

    class PodioTaskList implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://podio.com/tasks';

        observeMutations = true;

        issueElementSelector = '.task-detail';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let rightColumn = $$('.task-detail .task-right-column');
            if (rightColumn) {
                let container = $$.create('div');
                container.classList.add('task-via');
                container.appendChild(linkElement);
                rightColumn.insertBefore(container, rightColumn.lastElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$('.edit-task-title', issueElement.parentElement).textContent;
            let serviceUrl = source.protocol + source.host;
            let issueUrl: string;
            let _url = $$('.task-link', issueElement.parentElement).getAttribute('href');

            if (_url) {
                let matches = _url.match(/\/tasks\/\d+/);
                if (matches) {
                    issueUrl = matches[0];
                }
            }

            let issueId: string;

            let matches = issueUrl.match(/\d+/);
            if (matches) {
                issueId = matches[0];
            }

            let projectName = null;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'PodioTaskList' };
        }
    }

    IntegrationService.register(new PodioTaskList());
}