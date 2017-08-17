module Integrations {

    class Podio implements WebToolIntegration {

        showIssueId = false;

        matchUrl = ['*://podio.com/*'];

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            let menuList = $$('.task-header .action-bar ul');
            if (menuList) {
                let container = $$.create('li');
                container.classList.add('float-left', 'devart-timer-link-podio');
                container.appendChild(linkElement);

                let togglButton = $$('li > .toggl-button');
                menuList.insertBefore(container, togglButton && togglButton.parentElement);

                return;
            }

            let rightColumn = $$('div[id*=task-detail-] > div.image-block > .task-right-column');
            if (rightColumn) {
                let container = $$.create('div');
                container.classList.add('task-via');
                container.appendChild(linkElement);
                rightColumn.insertBefore(container, rightColumn.lastElementChild);

                return;
            }

            let breadcrumb = $$('.breadcrumb');
            if (breadcrumb) {
                let container = $$.create('div');
                container.classList.add('item-via');
                container.appendChild(linkElement);
                breadcrumb.parentElement.insertBefore(container, breadcrumb.nextSibling);
                return;
            }
        }
        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueId: string;
            let matches = source.path.match(/(\/tasks\/\d+)/);
            if (matches) {
                issueId = matches[1];
            }

            let issueName = this.getTaskName();

            var serviceUrl = source.protocol + source.host;
            var issueUrl = source.fullUrl.match(/\/tasks\/\d+/)[0];
            var projectName = null;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Podio' };
        }

        private getTaskName(): string {
            let taskName: string;

            // trying to get issueName from task list
            let task = $$('div[id^="task-detail-"]:not([style*="display: none"])');
            if (task) {
                let id = task.id.match(/^task-detail-(\d+)$/)[1]
                let taskNameWrapper = $$(`li[data-task-id="${id}"] .task-link`);
                if (taskNameWrapper) {
                    taskName = taskNameWrapper.textContent;
                }
            }

            // trying to get issueName from APP title
            if (!taskName) {
                taskName = $$.try('.breadcrumb .item-title').textContent;
            }

            // trying to get issueName from title of task details page
            if (!taskName) {
                taskName = $$.try('div.task-title').textContent;
            }

            if (taskName) {
                taskName = taskName.trim();
            }

            return taskName;
        }
    }

    IntegrationService.register(new Podio());
}