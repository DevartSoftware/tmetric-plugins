module Integrations {

    class Todoist implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*todoist.com/app?*';

        issueElementSelector = '.task_item';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.content > .text', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-start-todoist');
                host.insertBefore(linkElement, host.lastChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // <li class="task_item" id= "item_123456789">
            var issueNumber = issueElement.id.split('_')[1];
            if (!issueNumber) {
                return;
            }

            var issueId = '#' + issueNumber;

            // <span class="text sel_item_content"> Task Name <...> </span>
            let textNode = $$.findNode('.content > .text', Node.TEXT_NODE, issueElement);
            var issueName = textNode && textNode.nodeValue.trim();
            if (!issueName) {
                return;
            }

            // Project tab: <a href="#" class="project_link"><span>Личные </span></a>
            // Other tabs: <span class="pname" > Project Name </span>
            var projectName = $$.try('.pname', issueElement).textContent || $$.try('.project_link').textContent;

            var serviceType = 'Todoist';
            var serviceUrl = source.protocol + source.host;
            var issueUrl = 'showTask?id=' + issueNumber;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Todoist());
}