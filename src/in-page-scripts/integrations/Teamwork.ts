module Integrations {

    class Teamwork implements WebToolIntegration {

        observeMutations = true;

        matchUrl = [
            '*://*.teamwork.com/*',
            '*://*.teamworkpm.net/*'
        ]

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

    IntegrationService.register(new Teamwork());
}