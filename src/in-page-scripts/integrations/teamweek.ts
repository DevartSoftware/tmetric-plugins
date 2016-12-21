module Integrations {

    class Teamweek implements WebToolIntegration {

        observeMutations = true;

        // Workspace task url:
        // https://app.teamweek.com/#timeline/task/WORKSPACE_ID/TASK_ID
        matchUrl = '*://app.teamweek.com/#timeline*';

        issueElementSelector = '.timeline-task-popup';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('[data-hook="row-actions"]', issueElement);
            if (host) {
                linkElement.classList.add(
                    'devart-timer-link-teamweek',
                    'devart-timer-link-minimal',
                    'button', 'button--large', 'button--icon');
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueName = $$.try<HTMLInputElement>('[data-hook="input-name"]', issueElement).value;
            if (!issueName) {
                return;
            }

            var match = /^(.+)\/(#timeline\/task\/\d+)\/(\d+)$/.exec(source.fullUrl);

            var projectName = $$.try<HTMLInputElement>('[data-hook="input-project"]', issueElement).value;

            if (match) {
                var issueId = '#' + match[3];
                var issueUrl = match[2] + '/' + match[3];
            }

            var serviceType = 'Teamweek';
            var serviceUrl = source.protocol + source.host;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Teamweek());
}