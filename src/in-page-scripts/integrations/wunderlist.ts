module Integrations {

    class WunderlistTask implements WebToolIntegration {

        observeMutations = true;

        // Task in list
        // https://www.wunderlist.com/#/lists/LIST_ID
        // Task in list with description
        // https://www.wunderlist.com/#/tasks/TASK_ID
        matchUrl = '*://www.wunderlist.com/*#/*';

        issueElementSelector = '.taskItem';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var task = $$('.taskItem-titleWrapper', issueElement);
            if (task) {
                linkElement.classList.add('devart-timer-link-wunderlist');
                task.insertBefore(linkElement, task.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueName = $$.try('.taskItem-titleWrapper-title', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var issueNumber = issueElement.getAttribute('rel');
            if (issueNumber) {
                var issueId = '#' + issueNumber;
                var issueUrl = '/#/tasks/' + issueNumber;
            }

            // project name for lists
            var projectName = $$.try('#list-toolbar .title').textContent;
            
            // project name for smart lists
            if (/.*\/(assigned|starred|today|all|completed)$/.test(source.fullUrl)) {
                let tasks = $$.closest('.tasks', issueElement);
                let heading = tasks && $$.before('.heading', tasks);
                projectName = heading && heading.textContent;
            } else if (/.*\/week$/.test(source.fullUrl)) {
                projectName = $$.try('.taskItem-duedate', issueElement).textContent;
            }

            var serviceType = 'Wunderlist';

            var serviceUrl = source.protocol + source.host;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new WunderlistTask());
}