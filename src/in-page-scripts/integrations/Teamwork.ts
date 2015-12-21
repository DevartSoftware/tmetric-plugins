module Integrations {

    class Teamwork implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*.teamwork.com/*';

        issueElementSelector() {
            return $$.all('#Task > .titleHolder').concat($$.all('.taskInner'))
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            if (issueElement.parentElement.id == 'Task') {
                var host = $$('.options', issueElement);
                if (host) {
                    var linkContainer = $$.create('li');
                    linkContainer.appendChild(linkElement);
                    linkElement.classList.add('btn', 'btn-default');
                    host.insertBefore(linkContainer, host.firstElementChild);
                }
            } else {
                var host = $$('.taskUsedOps', issueElement);
                if (host) {
                    var linkContainer = $$.create('span', 'devart-timer-link-teamwork');
                    linkContainer.appendChild(linkElement);
                    host.parentElement.insertBefore(linkContainer, host.nextElementSibling);
                }
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var taskText = $$('.taskRHSText .ql.tipped', issueElement);
            if (taskText) {
                // tasks from list
                var issueHref = taskText.getAttribute('href');
                var match = /^.*tasks\/(\d+)$/.exec(issueHref);
                var issueIdNumber = match[1];
            } else {
                // top task in single view
                var taskSidebar = $$('#ViewTaskSidebar');
                if (taskSidebar) {
                    var issueIdNumber = taskSidebar.getAttribute('data-taskid');
                }
            }
            if (!issueIdNumber) {
                return;
            }
            var issueId = '#' + issueIdNumber;

            var issueName =
                $$.try('.taskName', issueElement).textContent || // tasks from list
                $$.try('#TaskContent .taskDetailsName').textContent; // top task in single view
            if (!issueName) {
                return;
            }

            var projectNameElement = $$('#projectName');
            if (projectNameElement) {
                // single project tasks view
                var projectName = projectNameElement.firstChild.textContent;
            } else {
                // multi project tasks view
                // https://COMPANY.teamwork.com/all_tasks
                var parentRowElement = $$.closest('tr', issueElement);
                if (parentRowElement) {
                    var projectName = $$.try('.prjName', parentRowElement).textContent;
                }
            }

            var serviceType = 'Teamwork';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = 'tasks/' + issueIdNumber;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }









            }
        }
    }

    IntegrationService.register(new Teamwork());
}