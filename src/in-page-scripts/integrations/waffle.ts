module Integrations {

    class Waffle implements WebToolIntegration {

        observeMutations = true

        // Project card url:
        // https://waffle.io/USER_NAME/PROJECT_NAME/cards/CARD_ID
        matchUrl = '*://waffle.io/*/*/cards/*'

        issueElementSelector = '.modal-dialog'

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.discussion-status', issueElement);
            if (host) {
                var linkContainer = $$.create('div');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // actual issue is located on github.com
            var serviceType = 'GitHub';
            var serviceUrl = 'https://github.com';

            var issueNumberElement = $$.try('.issue-number', issueElement);
            var issueUrlElement = $$.closest<HTMLAnchorElement>('a', issueNumberElement);
            if (!issueUrlElement) {
                return;
            }

            var issueUrl = $$.getRelativeUrl(serviceUrl, issueUrlElement.href);
            var issueIdPrefix = /^.*\/pull\/\d+$/.test(issueUrl) ? '!' : '#';

            var issueId = issueNumberElement.textContent;
            if (!issueId) {
                return;
            }
            issueId = issueIdPrefix + issueId;

            var issueName = $$.try('.issue-title', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var projectName = $$.try('.project-dropdown .dropdown-title').textContent;
            if (projectName) {
                projectName = projectName.split('/')[1];
            }

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Waffle());
}