module Integrations {
    class PivotalTracker implements WebToolIntegration {
        observeMutations = true

        matchUrl = '*://www.pivotaltracker.com/n/projects/*'

        match(source: Source): boolean {
            var title = $$('title');
            if (title) {
                return /.*- Pivotal Tracker$/.test(title.innerHTML);
            }
            return false;
        }

        issueElementSelector = '.story .model_details'

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('aside > .wrapper', issueElement);
            if (host) {
                var linkContainer = $$.create('div', 'devart-timer-link-pivotaltracker');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            // Project url:
            // https://www.pivotaltracker.com/n/projects/PROJECT_ID
            // Project story url:
            // https://www.pivotaltracker.com/n/projects/PROJECT_ID/stories/STORY_ID

            var match = /^\/n\/projects\/(\d+).*$/.exec(source.path);

            var result;

            if (match) {
                var issueId = (<HTMLInputElement>$$('.text_value', issueElement, true)).value;
                if (!issueId) {
                    return;
                }

                var issueName = $$('.editor', issueElement, true).textContent;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                var projectName = $$('.raw_context_name', true).textContent;
                if (projectName) {
                    projectName = projectName.trim();
                }

                var serviceType = 'PivotalTracker';

                var serviceUrl = source.protocol + source.host;

                var issueUrl = '/story/show/' + issueId.substring(1);

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
            }

            return result;
        }
    }

    IntegrationService.register(new PivotalTracker());
}