module Integrations {

    class Asana implements WebToolIntegration {

        observeMutations = true

        matchUrl = '*://app.asana.com/*/*/*'

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.sticky-view-placeholder', issueElement);
            if (host) {
                var linkContainer = $$.create('div', 'devart-timer-link-asana');
                linkContainer.appendChild(linkElement);
                host.parentElement.insertBefore(linkContainer, host.nextElementSibling);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Project url:
            // https://app.asana.com/0/PROJECT_ID
            // Project task url:
            // https://app.asana.com/0/PROJECT_ID/TASK_ID
            var match = /^\/\w+\/(\d+)\/(\d+)(\/f)*$/.exec(source.path);

            if (!match) {
                return;
            }

            var issueId = match[2];
            if (!issueId) {
                return;
            }

            issueId = '#' + issueId;

            var issueName = $$.try<HTMLTextAreaElement>('#details_property_sheet_title', issueElement).value;
            if (!issueName) {
                return;
            }

            var projectName = $$.try('.task-pot-view-container a').textContent;

            var serviceType = 'Asana';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = source.path;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Asana());
}