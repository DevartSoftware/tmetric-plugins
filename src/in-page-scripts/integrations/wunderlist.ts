module Integrations {

    class Wunderlist implements WebToolIntegration {

        observeMutations = true;

        // Task in list
        // https://www.wunderlist.com/#/lists/LIST_ID
        // Task in list with description
        // https://www.wunderlist.com/#/tasks/TASK_ID
        matchUrl = '*://www.wunderlist.com/*#/*';

        issueElementSelector = () => $$.all('.taskItem') // list item
            .concat($$.all('#detail')); // detail view

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var listTaskAnchor = $$('.taskItem-star', issueElement);
            var detailTaskHost = $$('.body', issueElement);

            if (listTaskAnchor) {
                linkElement.classList.add('devart-timer-link-wunderlist-list');
                listTaskAnchor.parentElement.insertBefore(linkElement, listTaskAnchor);
            } else if (detailTaskHost) {
                linkElement.classList.add('section', 'section-item', 'devart-timer-link-wunderlist-detail');
                detailTaskHost.insertBefore(linkElement, detailTaskHost.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var isDetail = issueElement.id == 'detail';

            var issueName =
                $$.try('.taskItem-titleWrapper-title', issueElement).textContent || // list item
                $$.try('.title-container .display-view', issueElement).textContent; // detail view
            if (!issueName) {
                return;
            }

            let match = /^(\d+)$/.exec(issueElement.getAttribute('rel')) || // list item
                isDetail && /^.*\/tasks\/(\d+)(\/.*)?$/.exec(source.fullUrl); // detail view
            if (match) {
                var issueId = '#' + match[1];
                var issueUrl = '/#/tasks/' + match[1];
            }

            // for new items in list the task id can not be parsed
            // should exit
            if (!isDetail && !match) {
                return;
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

    IntegrationService.register(new Wunderlist());
}