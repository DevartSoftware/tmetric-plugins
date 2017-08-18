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
            let issueUrl = $$('.task-link', issueElement.parentElement).getAttribute('href');
            let issueId: string;

            let matches = issueUrl.match(/\d+/);
            if (matches) {
                issueId = matches[0];
            }

            let projectName = null;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'PodioTaskList' };
        }
    }

    class PodioAppItem implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://podio.com/*/apps/*';

        observeMutations = true;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let actionBar = $$('.action-bar ul');
            if (actionBar) {
                let container = $$.create('li');
                container.classList.add('float-left', 'devart-timer-link-podio');
                container.appendChild(linkElement);
                actionBar.insertBefore(container, actionBar.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueId = null;
            let issueUrl = null;
            let issueName = $$.try('.breadcrumb .item-title').textContent;
            let serviceUrl = source.protocol + source.host;
            let projectName = null;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'PodioAppItem' };
        }
    }

    IntegrationService.register(new PodioTask());
    IntegrationService.register(new PodioTaskList());
    IntegrationService.register(new PodioAppItem());
}