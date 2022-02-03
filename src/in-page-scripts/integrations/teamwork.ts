// http://support.teamwork.com/projects/installation-and-account-134/can-i-change-the-domain-of-my-teamwork-account
const hosts = '((teamwork|seetodos|companytodos|worktodos|companyworkflow|projectgameplan|peopleworkflow|projecttodos|projectorganiser|seetasks)\.com|teamworkpm\.net)';

class Teamwork implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/.*');

    issueElementSelector() {
        return $$.all('.row-content-holder');
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('.task-options', issueElement);
        if (host) {
            const container = $$.create('span');
            linkElement.classList.add('option');
            container.classList.add('devart-timer-link-teamwork');
            container.appendChild(linkElement);
            host.insertBefore(container, host.querySelector('.task-options > a:not(.active)'));
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueName = $$.try('.task-name > span', issueElement).textContent;
        if (!issueName) {
            return;
        }

        // get identifier from href or from top task in single view
        let issueId: string;
        let issueUrl: string;
        const issueHref = $$.getAttribute('.task-name a[href*="tasks"]', 'href', issueElement);

        const matches = issueHref.match(/^.*tasks\/(\d+)$/);
        if (matches) {
            issueId = '#' + matches[1];
            issueUrl = 'tasks/' + matches[1];
        }

        // single project tasks view
        let projectName: string;
        const projectNameElement = $$('#projectName');
        if (projectNameElement) {
            projectName = projectNameElement.firstChild.textContent;
        }

        // multi project tasks view
        // https://COMPANY.teamwork.com/all_tasks
        if (!projectName) {
            const parentRowElement = $$.closest('tr', issueElement);
            if (parentRowElement) {
                projectName = $$.try('.prjName', parentRowElement).textContent;
            } else {
                projectName = $$.try('#top-left-header h3').textContent;
            }
        }

        const serviceType = 'Teamwork';

        const serviceUrl = source.protocol + source.host;

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
            const host = $$('.padding-wrap', issueElement);
            if (host) {
                const linkContainer = $$.create('div', 'devart-timer-link-teamwork-desk-ticket');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
            }
        } else {
            const host = $$('.task-options', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-teamwork-desk-task');
                host.parentElement.insertBefore(linkElement, host);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName: string, issueId: string, issueIdNumber: string, issueUrlPrefix: string, issueUrl: string, projectName: string;

        if (this.isTicketElement(issueElement)) {
            issueName = $$.try('.title-label a', issueElement).textContent;
            issueId = $$.try('.id-hold', issueElement).textContent;
            issueIdNumber = issueId.replace(/^\#/, '');
            issueUrlPrefix = 'desk/#/tickets/';
        } else {
            issueName = $$.try('.title-label', issueElement).textContent;
            const issueHref = $$.getAttribute('.title-label', 'href', issueElement);
            const issueHrefMatch = /^.*tasks\/(\d+)$/.exec(issueHref);
            issueIdNumber = issueHrefMatch && issueHrefMatch[1];
            issueId = '#' + issueIdNumber;
            issueUrlPrefix = 'tasks/';
            projectName = $$.try(
                'ul.task-meta.list-inline a',
                issueElement,
                el => /\/projects\/\d+/.test(el.getAttribute('href'))
            ).textContent;
        }

        if (!issueName) {
            return;
        }

        if (issueIdNumber && (issueIdNumber = issueIdNumber.trim())) {
            issueUrl = issueUrlPrefix + issueIdNumber;
        }

        const serviceType = 'Teamwork';

        const serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Teamwork());
IntegrationService.register(new TeamworkDesk());