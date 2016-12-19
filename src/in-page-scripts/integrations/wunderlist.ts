module Integrations {

    class WunderlistTask implements WebToolIntegration {

        observeMutations = true;

        // Task in list
        // https://www.wunderlist.com/webapp#/lists/LIST_ID
        // Task in list with description
        // https://www.wunderlist.com/webapp#/tasks/TASK_ID
        matchUrl = '*://www.wunderlist.com/webapp#/*';

        issueElementSelector() {
            return $$.all('.taskItem').concat($$.all('.subtask'));
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            linkElement.classList.add('devart-timer-link-wunderlist');
            
            var task = $$('.taskItem-titleWrapper', issueElement);
            if (task) {
                task.insertBefore(linkElement, task.firstElementChild);
            }

            var subtask = $$('.section-content', issueElement);
            if (subtask) {
                subtask.parentElement.insertBefore(linkElement, subtask);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueName = $$.try('.taskItem-titleWrapper-title', issueElement).textContent;
            if (!issueName) {
                
                var taskName = $$.try('.taskItem.selected .taskItem-titleWrapper-title').textContent;
                var subtaskName = $$.try('.display-view', issueElement).textContent;

                var isSubtask = taskName && subtaskName;

                if (isSubtask) {
                    issueName = taskName + ' - ' + subtaskName;
                }

            }

            if (!issueName) {
                return;
            }

            var issueNumber = isSubtask ?
                    $$.getAttribute('.taskItem.selected', 'rel') :
                    issueElement.getAttribute('rel');
            if (issueNumber) {
                var issueId = '#' + issueNumber;
                var issueUrl = '/webapp#/tasks/' + issueNumber;
            }

            var projectName = $$.try('#list-toolbar .title').textContent;

            var serviceType = 'Wunderlist';

            var serviceUrl = source.protocol + source.host;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new WunderlistTask());
}