module Integrations {

    class Teamwork implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*.teamwork.com/*';

        issueElementSelector() {
            return $$.all('#Task > .titleHolder')
                .concat($$.all('#TaskContent .topTask > .taskInner'))
                .concat($$.all('#TaskContent .subTask > .taskInner'));
        }

        isTopTaskTitleElement(issueElement: HTMLElement) {
            return issueElement.parentElement.id == 'Task';
        }

        isTopTaskRowElement(issueElement: HTMLElement) {
            return issueElement.parentElement.classList.contains('topTask');
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            if (this.isTopTaskTitleElement(issueElement)) {
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

            if (this.isTopTaskTitleElement(issueElement) || this.isTopTaskRowElement(issueElement)) {

                var issueIdNumber = $$.try('#ViewTaskSidebar').getAttribute('data-taskid');
                if (!issueIdNumber) {
                    return;
                }
                var issueId = '#' + issueIdNumber;

                var issueName = $$.try('#TaskContent .taskDetailsName').textContent;
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