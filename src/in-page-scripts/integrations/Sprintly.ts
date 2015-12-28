module Integrations {

    class Sprintly implements WebToolIntegration {

        observeMutations = true;

        // Workspace task url:
        // https://app.teamweek.com/#timeline/task/WORKSPACE_ID/TASK_ID
        matchUrl = '*://sprint.ly/*';

        issueElementSelector = '.card';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.actions .buttons', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-sprintly');
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            console.log('getIssue', issueElement);
            var issueName = $$.try('.title', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var projectNameElement = $$('a.products');
            if (projectNameElement) {
                var projectName = projectNameElement.textContent;
                var projectUrl = projectNameElement.getAttribute('href');
            }

            var serviceType = 'Sprintly';

            var issueNumberElement = $$('.number .value', issueElement);
            if (issueNumberElement) {
                var issueId = issueNumberElement.textContent;
                if (projectUrl) {
                    var match = /^([^\d]*)(\d+)$/.exec(issueNumberElement.textContent);
                    if (match) {
                        var issueUrl = projectUrl + 'item/' + match[2];
                        var serviceUrl = source.protocol + source.host;
                    }
                }
            }
            console.log({ issueId, issueName, projectName, serviceType, serviceUrl, issueUrl });
            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Sprintly());
}