module Integrations {

    class Asana implements WebToolIntegration {

        observeMutations = true

        matchUrl = '*://app.asana.com/*/*/*'

        match(source: Source): boolean {
            var title = $$('title');
            if (title) {
                return /.*Asana$/.test(title.innerHTML);
            }
            return false;
        }

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

            var result;

            if (match) {

                var issueId, issueName, projectName, serviceType, serviceUrl, issueUrl;

                issueId = match[2];
                if (!issueId) {
                    return;
                }

                issueId = '#' + issueId;

                issueName = (<HTMLTextAreaElement>$$.try('#details_property_sheet_title', issueElement)).value;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                projectName = $$.try('.task-pot-view-container a').textContent;
                if (projectName) {
                    projectName = projectName.trim();
                }

                serviceType = 'Asana';

                serviceUrl = source.protocol + source.host;

                issueUrl = source.path;

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
            }
            return result;
        }
    }

    IntegrationService.register(new Asana());
}