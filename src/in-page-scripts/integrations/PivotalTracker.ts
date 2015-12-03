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

        issueElementSelector = '.model_details'

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('aside > .wrapper', issueElement);
            if (host) {
                linkElement.classList.add('pivotaltracker');
                //linkElement.classList.add('button-link');
                host.appendChild(linkElement);
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

                var issueId, issueName, projectName, serviceType, serviceUrl, issueUrl;

                issueId = (<HTMLInputElement>$$('.text_value', issueElement, true)).value;
                if (!issueId) {
                    return;
                }

                issueName = $$('.editor', issueElement, true).textContent;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                projectName = $$('.raw_context_name', true).textContent;
                if (projectName) {
                    projectName = projectName.trim();
                }

                serviceType = 'PivotalTracker';

                serviceUrl = source.protocol + source.host;

                issueUrl = '/n/projects/' + match[1] + '/stories/' + issueId.substring(1);

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };

            }

            return result;
        }
    }

    IntegrationService.register(new PivotalTracker());
}