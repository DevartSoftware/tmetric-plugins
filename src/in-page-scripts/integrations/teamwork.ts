// http://support.teamwork.com/projects/installation-and-account-134/can-i-change-the-domain-of-my-teamwork-account
const hosts = '((teamwork|seetodos|companytodos|worktodos|companyworkflow|projectgameplan|peopleworkflow|projecttodos|projectorganiser|seetasks)\.com|teamworkpm\.net)';

class Teamwork implements WebToolIntegration {

    showIssueId = true;

    matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/.*');

    issueElementSelector = [
        '.row-content-holder',
        '.task-detail-header',
        '[data-test-id="td-drawer"]', // New UI detail
        '.TasksTableTask', // New UI table, home/work
        '[data-task-detail-panel-id]'// New UI list
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const container = $$.create('span');
        linkElement.classList.add('option');
        container.classList.add('devart-timer-link-teamwork');
        container.appendChild(linkElement);

        if (issueElement.matches(this.issueElementSelector[0])) {
            container.classList.add('w-task-row__option');
            issueElement.appendChild(container);
        }
        else if (issueElement.matches(this.issueElementSelector[2])) { //new UI - task detail
            const holder = $$('[data-identifier="tasklist"]', issueElement)

            if (holder) {
                holder.parentElement?.parentElement?.appendChild(container);
            }
        }
        else if (issueElement.matches(this.issueElementSelector[3])) { //new UI - table, home/work
            const holder = $$('.table-cell-task-quick-view', issueElement)
            if (holder) {
                holder.insertBefore(container, holder.firstChild);
            }
        }
        else if (issueElement.matches(this.issueElementSelector[4])) { //new UI - list
            container.classList.add('devart-timer-link-minimal');
            const holder = $$('[data-identifier="fab-date-icon"]', issueElement)?.parentElement
            if (holder) {
                holder.insertBefore(container, holder.firstChild);
            }
        }
        else {
            issueElement.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const issueName = $$.try('.w-task-row__name > span', issueElement).textContent
            || $$.try<HTMLInputElement>('.task-name > textarea').value
            || $$.try('.table-cell-task-name-link', issueElement)?.textContent?.trim() //new UI - table 
            || $$.try('span.text-h6', issueElement)?.textContent?.trim() //new UI - task detail
            || $$.try('[data-identifer="list-view-task-name"]', issueElement)?.textContent?.trim(); //new UI - list
        if (!issueName) {
            return;
        }

        // get identifier from href or from top task in single view
        let issueId: string | undefined | null;
        let issueUrl: string | undefined | null;
        const issueHref = $$.getAttribute('.w-task-row__name a[href*="tasks"]', 'href', issueElement)
            || $$.getAttribute('.table-cell-task-name-link', 'href', issueElement);

        const matches = issueHref.match(/^.*tasks\/(\d+)$/);
        if (matches) {
            issueId = '#' + matches[1];
            issueUrl = 'tasks/' + matches[1];
        }

        if (!issueId) {
            issueId = $$.try('.action_link').innerText;
        }
        if (!issueId) { // New UI detail
            issueId = $$('button[data-identifier="task-details-copy-task-id"]', issueElement)?.textContent?.trim();
        }
        if (!issueId) { // New UI list
            const taskDetailPanelId = issueElement.getAttribute('data-task-detail-panel-id');
            if (taskDetailPanelId) {
                issueId = '#' + taskDetailPanelId;
                issueUrl = 'tasks/' + taskDetailPanelId;
            }
        }
        if (!issueUrl && issueId) {
            issueUrl = 'tasks/' + issueId.substring(1);
        }

        let projectName: string | undefined | null;

        // single project tasks view
        const projectNameElement = $$('.w-header-titles__project-name');
        if (projectNameElement) {
            projectName = projectNameElement.firstChild?.textContent;
        }

        // multi project tasks view
        // https://COMPANY.teamwork.com/#/home/work
        if (!projectName) {
            const parentRowElement = $$.closest('.s-today__tasks-row', issueElement);
            if (parentRowElement) {
                const groupHeader = $$.prev('.u-group-title', parentRowElement);
                if (groupHeader) {
                    const projectAnchor = $$('a[href*=projects]', groupHeader);
                    if (projectAnchor) {
                        projectName = Array.from(projectAnchor.childNodes)
                            .filter(_ => _.nodeType == document.TEXT_NODE)
                            .map(_ => (_.textContent || '').trim())
                            .join('');
                    }
                }
            }
        }

        // project gantt chart
        // https://COMPANY.teamwork.com/#/projects/PROJECT_ID/gantt
        if (!projectName) {
            const header = $$('.w-gantt__top-left-header h3');
            if (header) {
                projectName = header.textContent;
            }
        }

        //new UI - task detail
        if (!projectName) {
            const projectBreadcrumb = $$('a[data-identifier="project"]', issueElement); //new UI - task detail
            if (projectBreadcrumb) {
                projectName = projectBreadcrumb.textContent?.trim();
            }
        }

        // New UI home/work
        if (!projectName) {
            projectName = $$('.TableViewRow__cell--project', issueElement)?.textContent?.trim(); 
        }

        // New UI list,table
        if (!projectName) {
            projectName = $$('[data-identifier="appshell-breadcrumbs-project-breadcrumbstoolbar-project"]')?.textContent?.trim(); 
        }

        let tagNames = $$.all('.w-tags__tag-name', issueElement).map(_ => _.textContent);
        if (tagNames.length == 0) {
            tagNames = $$.all('.task-detail-content .w-item-picker__item > button').map(_ => _.textContent);
        }

        // New UI table, home/work
        if (tagNames.length == 0) {
            const tagList = $$('.task-tags', issueElement);
            tagNames = $$.all('.w-item-picker__item > button', tagList).map(_ => _.textContent);
        }

        // New UI list
        if (tagNames.length == 0) {
            const tagList = $$('[data-identifier="list-view-tag-list"]', issueElement);
            tagNames = $$.all('.v-chip__content', tagList).map(_ => _.textContent);
        }

        //new UI - task detail
        if (tagNames.length == 0) { 
            const tagList = $$('[data-test-id="td-tag-list"]', issueElement);
            tagNames = $$.all('.v-chip__content', tagList).map(_ => _.textContent);
        }

        const serviceType = 'Teamwork';

        const serviceUrl = source.protocol + source.host;

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }
}

class TeamworkDesk implements WebToolIntegration {

    showIssueId = true;

    matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/desk\/.*');

    issueElementSelector() {
        return $$.all('.ticket-view-page--container').concat($$.all('.task-group__task-list-item'));
    }

    private isTicketElement(issueElement: HTMLElement) {
        return issueElement.classList.contains('ticket-view-page--container');
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (this.isTicketElement(issueElement)) {
            const buttons = $$('.right-buttons-container', issueElement);
            if (buttons) {
                const linkContainer = $$.create('div', 'devart-timer-link-teamwork-desk-ticket');
                linkContainer.appendChild(linkElement);
                buttons.parentElement!.insertBefore(linkContainer, buttons);
            }
        } else {
            const host = $$('.task-extras-container', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-teamwork-desk-task');
                host.appendChild(linkElement);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueName, issueId, issueUrl, projectName: string | undefined | null;

        if (this.isTicketElement(issueElement)) {
            issueName = $$.try('.title__subject', issueElement).textContent;
            issueId = ($$.try('.ticket-id', issueElement).textContent || '').trim();
            if (issueId) {
                issueUrl = 'desk/tickets/' + issueId.replace(/^\#/, '');
            }
        } else {
            issueName = $$.try('.task-name', issueElement).textContent;
            const issueHref = $$.getAttribute('a.task-actions__icon-wrapper', 'href', issueElement);
            const issueHrefMatch = /^.*tasks\/(\d+)$/.exec(issueHref);
            const issueIdNumber = issueHrefMatch && issueHrefMatch[1];
            if (issueIdNumber) {
                issueId = '#' + issueIdNumber;
                issueUrl = 'tasks/' + issueIdNumber;
            }

            const taskGroup = $$.closest('.task-group__list-item', issueElement);
            if (taskGroup) {
                const projectAnchor = $$('a[href*=projects]', taskGroup);
                if (projectAnchor) {
                    projectName = Array.from(projectAnchor.childNodes)
                        .filter(_ => _.nodeType == document.TEXT_NODE)
                        .map(_ => (_.textContent || '').trim())
                        .join('');
                }
            }
        }

        if (!issueName) {
            return;
        }

        const serviceType = 'Teamwork';
        const serviceUrl = source.protocol + source.host;

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Teamwork());
IntegrationService.register(new TeamworkDesk());