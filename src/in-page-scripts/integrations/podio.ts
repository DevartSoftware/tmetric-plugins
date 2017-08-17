module Integrations {
    class Podio implements WebToolIntegration {
        showIssueId = false;

        matchUrl = '*://podio.com/tasks*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var menuList = $$('.task-header .action-bar ul');
            if (menuList) {
                let container = $$.create('li');
                container.classList.add('float-left');
                container.appendChild(linkElement);
                menuList.appendChild(container);

                return;
            }

            var rightColumn = $$('div[id*=task-detail-] > div.image-block > .task-right-column');
            if (rightColumn) {
                let container = $$.create('div');
                container.classList.add('task-via');
                container.appendChild(linkElement);
                rightColumn.insertBefore(container, rightColumn.lastElementChild);

                return;
            }
        }
        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueId: string;
            var matches = source.path.match(/\d+/);
            if (matches) {
                issueId = matches[0];
            }

            var issueName = $$.try('.ticket-name').textContent;
            var serviceUrl = source.protocol + source.host;
            var issueUrl = source.path;
            var projectName = $$.try('.project-name').textContent;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Podio' };
        }
    }

    IntegrationService.register(new Podio());
}