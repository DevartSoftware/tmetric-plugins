module Integrations {

    // http://support.teamwork.com/projects/installation-and-account-134/can-i-change-the-domain-of-my-teamwork-account
    let hosts = '((teamwork|seetodos|companytodos|worktodos|companyworkflow|projectgameplan|peopleworkflow|projecttodos|projectorganiser|seetasks)\.com|teamworkpm\.net)';

    class Teamwork implements WebToolIntegration {

        showIssueId = true;

        observeMutations = true;

        matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/.*');

        issueElementSelector() {
            return $$.all('#Task > .titleHolder').concat($$.all('.taskInner'));
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            if (issueElement.parentElement.id == 'Task') {
                // single task view
                let host = $$('.options', issueElement);
                if (host) {
                    let linkContainer = $$.create('li');
                    linkContainer.appendChild(linkElement);
                    linkElement.classList.add('btn', 'btn-default');
                    host.insertBefore(linkContainer, host.firstElementChild);
                }
            } else {
                // task list view
                let host = $$('.taskUsedOps', issueElement);
                if (host) {
                    let linkContainer = $$.create('span', 'devart-timer-link-teamwork');
                    linkContainer.appendChild(linkElement);
                    host.parentElement.insertBefore(linkContainer, host.nextElementSibling);
                }
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueName =
                $$.try('.taskName', issueElement).textContent || // tasks from list
                $$.try('#Task .taskDetailsName').textContent; // top task in single view
            if (!issueName) {
                return;
            }

            // get identifier from href or from top task in single view
            var issueHref = $$.getAttribute('.taskRHSText .ql.tipped', 'href', issueElement);
            var issueHrefMatch = /^.*tasks\/(\d+)$/.exec(issueHref);
            var issueIdNumber = issueHrefMatch ? issueHrefMatch[1] : $$.getAttribute('#Task .commentForm input[name=objectId]', 'value');

            if (issueIdNumber) {
                var issueId = '#' + issueIdNumber;
            }

            // single project tasks view
            var projectNameElement = $$('#projectName');
            if (projectNameElement) {
                var projectName = projectNameElement.firstChild.textContent;
            }

            // multi project tasks view
            // https://COMPANY.teamwork.com/all_tasks
            if (!projectName) {
                let parentRowElement = $$.closest('tr', issueElement);
                if (parentRowElement) {
                    projectName = $$.try('.prjName', parentRowElement).textContent;
                }
            }

            var serviceType = 'Teamwork';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = 'tasks/' + issueIdNumber;

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
                projectName = $$.try(
                    'ul li a',
                    issueElement,
                    el => /\/projects\/\d+$/.test(el.getAttribute('href'))
                ).textContent;
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
}