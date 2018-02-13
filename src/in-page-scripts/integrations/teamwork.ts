// http://support.teamwork.com/projects/installation-and-account-134/can-i-change-the-domain-of-my-teamwork-account
let hosts = '((teamwork|seetodos|companytodos|worktodos|companyworkflow|projectgameplan|peopleworkflow|projecttodos|projectorganiser|seetasks)\.com|teamworkpm\.net)';

class Teamwork implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/.*');

    issueElementSelector() {
        return $$.all('.row-content-holder');
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('.task-options', issueElement);
        if (host) {
            let container = $$.create('span');
            linkElement.classList.add('option');
            container.classList.add('devart-timer-link-teamwork');
            container.appendChild(linkElement);
            host.insertBefore(container, host.querySelector('.task-options > a:not(.active)'));
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.task-name > span', issueElement).textContent;
        if (!issueName) {
            return;
        }

        // get identifier from href or from top task in single view
        let issueId: string;
        let issueUrl: string;
        let issueHref = $$.getAttribute('.task-name a[href*="tasks"]', 'href', issueElement);

        let matches = issueHref.match(/^.*tasks\/(\d+)$/);
        if (matches) {
            issueId = '#' + matches[1];
            issueUrl = 'tasks/' + matches[1];
        }

        // single project tasks view
        let projectName: string;
        let projectNameElement = $$('#projectName');
        if (projectNameElement) {
            projectName = projectNameElement.firstChild.textContent;
        }

        // multi project tasks view
        // https://COMPANY.teamwork.com/all_tasks
        if (!projectName) {
            let parentRowElement = $$.closest('tr', issueElement);
            if (parentRowElement) {
                projectName = $$.try('.prjName', parentRowElement).textContent;
            } else {
                projectName = $$.try('#top-left-header h3').textContent;
            }
        }

        let serviceType = 'Teamwork';

        let serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

class TeamworkDesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/desk\/.*');

    issueElementSelector() {
        return $$.all('.ticket--header').concat($$.all('.task-row'));
    }

    private isTicketElement(issueElement: HTMLElement) {
        return issueElement.classList.contains('ticket--header');
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (this.isTicketElement(issueElement)) {
            let host = $$('.padding-wrap', issueElement);
            if (host) {
                let linkContainer = $$.create('div', 'devart-timer-link-teamwork-desk-ticket');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
            }
        } else {
            let host = $$('.task-options', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-teamwork-desk-task');
                host.parentElement.insertBefore(linkElement, host);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        var issueName: string, issueId: string, issueIdNumber: string, issueUrlPrefix: string, projectName: string;

        if (this.isTicketElement(issueElement)) {
            issueName = $$.try('.title-label a', issueElement).textContent;
            issueId = $$.try('.id-hold', issueElement).textContent;
            issueIdNumber = issueId.replace(/^\#/, '');
            issueUrlPrefix = 'desk/#/tickets/';
        } else {
            issueName = $$.try('.title-label', issueElement).textContent;
            let issueHref = $$.getAttribute('.title-label', 'href', issueElement);
            let issueHrefMatch = /^.*tasks\/(\d+)$/.exec(issueHref);
            issueIdNumber = issueHrefMatch && issueHrefMatch[1];
            issueId = '#' + issueIdNumber;
            issueUrlPrefix = 'tasks/';
            projectName = $$.try('ul.task-meta.list-inline a', issueElement).textContent;
        }

        if (!issueName) {
            return;
        }

        if (issueIdNumber && (issueIdNumber = issueIdNumber.trim())) {
            var issueUrl = issueUrlPrefix + issueIdNumber;
        }

        var serviceType = 'Teamwork';

        var serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Teamwork());
IntegrationService.register(new TeamworkDesk());