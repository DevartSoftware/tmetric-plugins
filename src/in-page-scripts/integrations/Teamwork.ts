module Integrations {

    class Teamwork implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*.teamwork.com/*';

        issueElementSelector = () => {
            var tasks = $$.all('.taskInner');
            var task = $$('#Task');
            if (task) {
                tasks.push(task);
            }
            return tasks;
        };

        isTaskView(issueElement: HTMLElement) {
            return issueElement.id == 'Task';
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            if (this.isTaskView(issueElement)) {
                var host = $$('.options', issueElement);
                if (host) {
                    var linkContainer = $$.create('li');
                    linkContainer.appendChild(linkElement);
                    linkElement.classList.add('btn');
                    linkElement.classList.add('btn-default');
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

            if (this.isTaskView(issueElement)) {

                var issueIdNumber = $$.try('#ViewTaskSidebar').getAttribute('data-taskid');
                if (!issueIdNumber) {
                    return;
                }
                var issueId = '#' + issueIdNumber;

                var issueName = $$.try('.taskDetailsName', issueElement).textContent;
                if (!issueName) {
                    return;
                }

                var projectName = $$.try('#projectName').textContent;

                var serviceType = 'Teamwork';

                var serviceUrl = source.protocol + source.host;

                var issueUrl = 'tasks/' + issueIdNumber;

                return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
            } else {

                var issueHrefElement = $$('.ql.tipped', issueElement);
                if (!issueHrefElement) {
                    return;
                }
                var issueHref = issueHrefElement.getAttribute('href');
                var match = /^.*tasks\/(\d+)$/.exec(issueHref);
                if (!match) {
                    return;
                }

                var issueId = '#' + match[1];

                var issueName = $$.try('.taskName', issueElement).textContent;
                if (!issueName) {
                    return;
                }

                var projectName = $$.try('#projectName').textContent;

                var serviceType = 'Teamwork';

                var serviceUrl = source.protocol + source.host;

                var issueUrl = $$.getRelativeUrl(serviceUrl, issueHref);

                return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
            }
        }
    }

    IntegrationService.register(new Teamwork());
}