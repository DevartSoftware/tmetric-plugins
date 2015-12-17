module Integrations {

    class Wrike implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://www.wrike.com/workspace.htm#*';

        issueElementSelector = '.wspace-task-view';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.wrike-panel-header-toolbar', issueElement);
            if (host) {
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Permalink schema: https://www.wrike.com/open.htm?id=TASK_ID
            var permalink = $$.try('.wspace-button-permalink', issueElement).getAttribute('href');
            if (!permalink) {
                return;
            }

            var issueId = permalink.split('?id=')[1];
            if (!issueId) {
                return;
            }
            issueId = '#' + issueId;

            var issueName = $$.try<HTMLTextAreaElement>('.wspace-task-widgets-title-view textarea', issueElement).value;
            if (!issueName) {
                return;
            }

            var issueTags = $$.all('.wspace-task-widgets-tags-dataview > div', issueElement);
            if (issueTags.length == 1) {
                var projectName = issueTags[0].textContent;
            }

            var serviceType = 'Wrike';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = $$.getRelativeUrl(serviceUrl, permalink);

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Wrike());
}