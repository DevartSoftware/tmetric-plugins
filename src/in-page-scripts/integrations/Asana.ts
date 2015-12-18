module Integrations {

    class Asana implements WebToolIntegration {

        observeMutations = true;

        matchUrl = [
            '*://app.asana.com/*/*',
        ];

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.sticky-view-placeholder', issueElement);
            if (host) {
                var linkContainer = $$.create('div', 'devart-timer-link-asana');
                linkContainer.appendChild(linkElement);
                host.parentElement.insertBefore(linkContainer, host.nextElementSibling);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Project url:
            // https://app.asana.com/0/PROJECT_ID
            // Project task url:
            // https://app.asana.com/0/PROJECT_ID/TASK_ID
            // Project search url:
            // https://app.asana.com/0/search/PROJECT_ID/TASK_ID
            var match = /^\/(\w+)(\/search)?\/(\d+)\/(\d+)(\/f)?$/.exec(source.path);

            if (match) {
                var issueId = '#' + match[4]

                var issueUrl = '/0/0/' + match[4];

                var serviceType = 'Asana';

                var serviceUrl = source.protocol + source.host;
            }

            var issueName = $$.try<HTMLTextAreaElement>('#details_property_sheet_title', issueElement).value;
            if (!issueName) {
                return;
            }

            var projectName =
                $$.try('.tokens-container .token_name').textContent || // task
                $$.try('.ancestor-projects .token').textContent; // subtask

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Asana());
}