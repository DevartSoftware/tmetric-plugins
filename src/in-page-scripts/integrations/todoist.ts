module Integrations {

    class Todoist implements WebToolIntegration {

        observeMutations = true;

        matchUrl = [
            '*://todoist.com/app?*',
            '*://*.todoist.com/app?*'
        ];

        issueElementSelector = '.task_item';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.content > span', issueElement);
            if (host) {
                host.insertBefore(linkElement, host.lastChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueNumber = issueElement.id.split('_')[1];
            if (!issueNumber) {
                return;
            }

            var issueId = '#' + issueNumber;

            var issueNameNode = $$.try('.content > span', issueElement).firstChild;
            var issueName = issueNameNode && issueNameNode.textContent.trim();
            if (!issueName) {
                return;
            }

            var projectName = $$.try('.project_link').textContent || $$.try('.pname', issueElement).textContent;

            var serviceType = 'Todoist';
            var serviceUrl = source.protocol + 'todoist.com';
            var issueUrl = 'showTask?id=' + issueNumber;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Todoist());
}