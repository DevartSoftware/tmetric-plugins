module Integrations {

    class PivotalTracker implements WebToolIntegration {

        observeMutations = true;

        matchUrl = [
            '*://www.pivotaltracker.com/n/workspaces/*',
            '*://www.pivotaltracker.com/n/projects/*'
        ];

        issueElementSelector = '.story .model_details';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('aside > .wrapper', issueElement);
            if (host) {
                var linkContainer = $$.create('div', 'devart-timer-link-pivotaltracker');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueId = $$.try<HTMLInputElement>('.text_value', issueElement).value;
            if (!issueId) {
                return;
            }

            var issueName = $$.try('.editor', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var projectName = $$.try('.raw_context_name').textContent;

            var serviceType = 'PivotalTracker';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = '/story/show/' + issueId.substring(1);

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new PivotalTracker());
}