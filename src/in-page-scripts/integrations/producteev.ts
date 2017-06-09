module Integrations {

    class Producteev implements WebToolIntegration {

        showIssueId = false;

        observeMutations = true;

        matchUrl = '*://www.producteev.com/workspace/t/*';

        issueElementSelector = '#task-details';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.td-attributes', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-producteev');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Urls:
            // https://www.producteev.com/workspace/t/TASK_ID
            // https://www.producteev.com/workspace/t/TASK_ID/calendar
            // https://www.producteev.com/workspace/t/TASK_ID/activity
            var match = /^\/workspace\/t\/(\w+)(\/calendar|\/activity)?$/.exec(source.path);
            if (!match) {
                return;
            }

            var issueId = match[1];
            if (!issueId) {
                return;
            }

            var issueName = $$.try('.title-header .title', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var projectName = $$.try('.dropdown-project .title').textContent;

            var serviceType = 'Producteev';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = '/workspace/t/' + match[1];

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Producteev());
}