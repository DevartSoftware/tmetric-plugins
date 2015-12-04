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
            var host = $$('#details_pane_title_row', issueElement);
            console.log('host');
            if (host) {
                var linkContainer = $$.create('div', 'asana');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
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

                issueName = (<HTMLTextAreaElement>$$('#details_property_sheet_title', issueElement, true)).value;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                projectName = $$('.task-pot-view-container a', true).textContent;
                if (projectName) {
                    projectName = projectName.trim();
                }

                serviceType = 'Asana';

                serviceUrl = source.protocol + source.host;

                issueUrl = source.path;

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };

            }
            console.log(result);
            return result;
        }
    }

    IntegrationService.register(new Asana());
}