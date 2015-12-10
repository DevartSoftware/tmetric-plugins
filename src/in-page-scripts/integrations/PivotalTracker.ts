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

            // Workspace url:
            // https://www.pivotaltracker.com/n/workspaces/WORKSPACE_ID
            // Project url:
            // https://www.pivotaltracker.com/n/projects/PROJECT_ID
            // Project story url:
            // https://www.pivotaltracker.com/n/projects/PROJECT_ID/stories/STORY_ID
            var match = /^\/n\/(workspaces|projects)\/(\d+).*$/.exec(source.path);
            if (!match) {
                return;
            }

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