module Integrations {

    class PodioTask implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://podio.com/tasks/*';

        observeMutations = true;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let taskHeader = $$('.task-header .action-bar ul');
            if (taskHeader) {
                let container = $$.create('li', 'float-left', 'devart-timer-link-podio');
                container.appendChild(linkElement);
                taskHeader.appendChild(container);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.task-title > .header-title').textContent;
            if (!issueName) {
                return;
            }

            let issueUrl: string;
            let issueId: string;

            let matches = source.path.match(/^\/tasks\/(\d+)/);
            if (matches) {
                issueUrl = matches[0];
                issueId = matches[1];
            }

            var serviceUrl = source.protocol + source.host;

            return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'Podio' };
        }
    }

    class PodioTaskList implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://podio.com*/tasks';

        observeMutations = true;

        issueElementSelector = '.task-wrapper';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let rightColumn = $$('.task-right-column', issueElement);
            if (rightColumn) {
                let container = $$.create('div', 'task-via');
                container.appendChild(linkElement);
                rightColumn.insertBefore(container, rightColumn.lastElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.edit-task-title', issueElement).textContent;
            if (!issueName) {
                return;
            }

            let issueUrl: string;
            let issueId: string;

            let href = (<HTMLAnchorElement>$$.try('.task-link', issueElement)).href || '';
            let matches = href.match(/\/tasks\/(\d+)/);
            if (matches) {
                issueUrl = matches[0];
                issueId = matches[1];
            }

            let serviceUrl = source.protocol + source.host;

            return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'Podio' };
        }
    }

    class PodioAppItem implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://podio.com/*/apps/*';

        observeMutations = true;

        issueElementSelector = '.item-topbar'

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let actionBar = $$('.action-bar ul', issueElement);
            if (actionBar) {
                let container = $$.create('li', 'float-left', 'devart-timer-link-podio');
                container.appendChild(linkElement);
                actionBar.insertBefore(container, actionBar.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            let issueName = $$.try('.breadcrumb .item-title', issueElement).textContent;
            return { issueName };
        }
    }

    IntegrationService.register(new PodioTask(), new PodioTaskList(), new PodioAppItem());
}