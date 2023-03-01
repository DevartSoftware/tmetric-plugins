// http://support.teamwork.com/projects/installation-and-account-134/can-i-change-the-domain-of-my-teamwork-account
const hosts = '((teamwork|seetodos|companytodos|worktodos|companyworkflow|projectgameplan|peopleworkflow|projecttodos|projectorganiser|seetasks)\.com|teamworkpm\.net)';

class Teamwork implements WebToolIntegration {

    showIssueId = true;

    matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/.*');

    issueElementSelector = [
        '.row-content-holder',
        '.task-detail-header'
    ]; 

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const container = $$.create('span');
        linkElement.classList.add('option');
        container.classList.add('devart-timer-link-teamwork');
        if (issueElement.className === 'row-content-holder') {
            container.classList.add('w-task-row__option');
        }
        container.appendChild(linkElement);
        issueElement.appendChild(container);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueName = $$.try('.w-task-row__name > span', issueElement).textContent || $$.try<HTMLInputElement>('.task-name > textarea').value;
        if (!issueName) {
            return;
        }

        // get identifier from href or from top task in single view
        let issueId: string;
        let issueUrl: string;
        const issueHref = $$.getAttribute('.w-task-row__name a[href*="tasks"]', 'href', issueElement);

        const matches = issueHref.match(/^.*tasks\/(\d+)$/);
        if (matches) {
            issueId = '#' + matches[1];
            issueUrl = 'tasks/' + matches[1];
        }

        if (!issueId) {
            issueId = $$.try('.action_link').innerText;
        }
        if (!issueUrl) {
            issueUrl = 'tasks/' + issueId.substring(1);
        }

        let projectName: string;

        // single project tasks view
        const projectNameElement = $$('.w-header-titles__project-name');
        if (projectNameElement) {
            projectName = projectNameElement.firstChild.textContent;
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
                            .map(_ => _.textContent.trim())
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

        let tagNames = $$.all('.w-tags__tag-name', issueElement).map(_ => _.textContent);
        if (tagNames.length == 0) {
            tagNames = $$.all('.task-detail-content .w-item-picker__item > button').map(_ => _.textContent);
        }
        const serviceType = 'Teamwork';

        const serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
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
                buttons.parentElement.insertBefore(linkContainer, buttons);
            }
        } else {
            const host = $$('.task-extras-container', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-teamwork-desk-task');
                host.appendChild(linkElement);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName: string, issueId: string, issueUrl: string, projectName: string;

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
                        .map(_ => _.textContent.trim())
                        .join('');
                }
            }
        }

        if (!issueName) {
            return;
        }

        const serviceType = 'Teamwork';

        const serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Teamwork());
IntegrationService.register(new TeamworkDesk());