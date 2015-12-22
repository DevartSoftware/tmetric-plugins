module Integrations {

    // http://support.teamwork.com/projects/installation-and-account-134/can-i-change-the-domain-of-my-teamwork-account
    let hosts = '((teamwork|seetodos|companytodos|worktodos|companyworkflow|projectgameplan|peopleworkflow|projecttodos|projectorganiser|seetasks)\.com|teamworkpm\.net)';

    class Teamwork implements WebToolIntegration {

        observeMutations = true;

        matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/.*');

        issueElementSelector() {
            return $$.all('#Task > .titleHolder').concat($$.all('.taskInner'))
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            if (issueElement.parentElement.id == 'Task') {
                let host = $$('.options', issueElement);
                if (host) {
                    let linkContainer = $$.create('li');
                    linkContainer.appendChild(linkElement);
                    linkElement.classList.add('btn', 'btn-default');
                    host.insertBefore(linkContainer, host.firstElementChild);
                }
            } else {
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
                $$.try('#TaskContent .taskDetailsName').textContent; // top task in single view
            if (!issueName) {
                return;
            }

            // get identifier from href or from top task in single view
            var issueHref = $$.getAttribute('.taskRHSText .ql.tipped', 'href', issueElement);
            var issueHrefMatch = /^.*tasks\/(\d+)$/.exec(issueHref);
            var issueIdNumber = issueHrefMatch ? issueHrefMatch[1] : $$.getAttribute('#ViewTaskSidebar', 'data-taskid');

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

        observeMutations = true;

        integrateInIFrames = true;
        matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/desk\/.*');

        issueElementSelector() {
            var taskFrame = $$<HTMLIFrameElement>('#viewTaskIframe');
            if (taskFrame) {
                return $$.all('#Task', taskFrame.contentDocument);
            } else {
                return $$.all('.ticket--header').concat($$.all('.reply--box .content_wrap'));
            }
        }

        isTicketElement(issueElement: HTMLElement) {
            return issueElement.classList.contains('ticket--header');
        }

        isTaskFrameElement(issueElement: HTMLElement) {
            return issueElement.id == 'Task';
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            if (this.isTaskFrameElement(issueElement)) {
                let host = $$('.options', issueElement);
                if (host) {
                    let linkContainer = $$.create('li', 'devart-timer-link-teamwork-desk-task-frame');
                    linkElement.classList.add('btn', 'btn-default');
                    linkContainer.appendChild(linkElement);
                    host.appendChild(linkContainer);
                }
            } else if (this.isTicketElement(issueElement)) {
                let host = $$('.padding-wrap', issueElement);
                if (host) {
                    let linkContainer = $$.create('div', 'devart-timer-link-teamwork-desk-ticket');
                    linkContainer.appendChild(linkElement);
                    host.appendChild(linkContainer);
                }
            } else {
                let host = $$('h5', issueElement);
                if (host) {
                    host.appendChild(linkElement);
                }
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var taskFrame = $$<HTMLIFrameElement>('#viewTaskIframe');
            if (taskFrame) {
                var frameSrcMatch = /(.*\/tasks\/\d+)(\?.*)?/.exec(taskFrame.getAttribute('src'));
                var taskUrl = frameSrcMatch && frameSrcMatch[1];
                if (!taskUrl) {
                    return;
                }
                issueElement = $$.all('.reply--box .content_wrap').filter(function (task) {
                    return $$.getAttribute('h5 a', 'href', task) == taskUrl;
                })[0];
                if (!issueElement) {
                    return;
                }
            }

            if (this.isTicketElement(issueElement)) {
                var issueName = $$.try('.title-label a', issueElement).textContent;
                var issueIdNumber = $$.try('#ticketId', issueElement).textContent;
                var issueUrlPrefix = 'desk/#/tickets/';
            } else {
                var issueName = $$.try('h5 a', issueElement).textContent;
                var projectName = $$.try('ul li a', issueElement, el => /\/projects\/\d+$/.test(el.getAttribute('href'))).textContent;
                let issueHref = $$.getAttribute('h5 a', 'href', issueElement);
                let issueHrefMatch = /^.*tasks\/(\d+)$/.exec(issueHref);
                var issueIdNumber = issueHrefMatch && issueHrefMatch[1];
                var issueUrlPrefix = 'tasks/';
            }

            if (!issueName) {
                return;
            }

            if (issueIdNumber && (issueIdNumber = issueIdNumber.trim())) {
                var issueId = '#' + issueIdNumber;
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