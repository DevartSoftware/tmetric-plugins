class PodioTask implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://podio.com/tasks/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        let taskHeader = $$('.task-header .action-bar ul');
        if (taskHeader) {
            let container = $$.create('li', 'float-left', 'devart-timer-link-podio');
            container.appendChild(linkElement);
            taskHeader.appendChild(container);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        let issueName = $$.try('.task-title > .header-title').textContent;
        if (!issueName) {
            return;
        }

        let issueUrl: string | undefined;
        let issueId: string | undefined;

        let matches = source.path.match(/^\/tasks\/(\d+)/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        const projectName = $$.try('.reference .title').textContent;
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Podio';

        return {
            issueId, issueName, issueUrl, serviceUrl, projectName, serviceType
        } as WebToolIssue;
    }
}

class PodioTaskList implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://podio.com*/tasks';

    issueElementSelector = '.task-wrapper';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let rightColumn = $$('.task-right-column', issueElement);
        if (rightColumn) {
            let container = $$.create('div', 'task-via');
            container.appendChild(linkElement);
            rightColumn.insertBefore(container, rightColumn.lastElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueName = $$.try('.edit-task-title', issueElement).textContent;
        if (!issueName) {
            return;
        }

        let projectName = $$.try('.edit-task-title + .linked-item', issueElement).textContent;

        let issueUrl: string | undefined;
        let issueId: string | undefined;

        let href = (<HTMLAnchorElement>$$.try('.task-link', issueElement)).href || '';
        let matches = href.match(/\/tasks\/(\d+)/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Podio';

        return {
            issueId, issueName, issueUrl, serviceUrl, projectName, serviceType
        } as WebToolIssue;
    }
}

class PodioAppItem implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://podio.com/*/apps/*';

    issueElementSelector = '.item-topbar'

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let actionBar = $$('.action-bar ul', issueElement);
        if (actionBar) {
            let container = $$.create('li', 'float-left', 'devart-timer-link-podio');
            container.appendChild(linkElement);
            actionBar.insertBefore(container, actionBar.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {
        const projectName = $$.try('.breadcrumb .item-title', issueElement).textContent;
        return { projectName } as WebToolIssue;
    }
}

IntegrationService.register(new PodioTask(), new PodioTaskList(), new PodioAppItem());