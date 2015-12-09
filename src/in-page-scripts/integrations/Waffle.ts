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
                var linkContainer = $$.create('div', 'devart-timer-link-waffle');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueId = $$.try('.issue-number', issueElement).textContent;
            if (!issueId) {
                return;
            }
            issueId = '#' + issueId;

            var issueName = $$.try('.issue-title', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var projectName = $$.try('.project-dropdown .dropdown-title').textContent;
            if (projectName) {
                projectName = projectName.split('/')[1];
            }

            var serviceType = 'Waffle';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = source.path;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Waffle());
}