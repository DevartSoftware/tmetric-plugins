module Integrations {

    class Wunderlist implements WebToolIntegration {

        showIssueId = false;

        observeMutations = true;

        // Task in list
        // https://www.wunderlist.com/#/lists/LIST_ID
        // Task in list with description
        // https://www.wunderlist.com/#/tasks/TASK_ID
        matchUrl = '*://www.wunderlist.com/*#/*';

        issueElementSelector = () => $$.all('.taskItem:not(.done)') // list item
            .concat($$.all('#detail')); // detail view

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            let listTaskAnchor = $$('.taskItem-star', issueElement);
            let detailTaskHost = $$('.body', issueElement);

            if (listTaskAnchor) {
                linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-wunderlist-list');
                listTaskAnchor.parentElement.insertBefore(linkElement, listTaskAnchor);
            } else if (detailTaskHost) {
                linkElement.classList.add('section', 'section-item', 'devart-timer-link-wunderlist-detail');
                detailTaskHost.insertBefore(linkElement, detailTaskHost.firstElementChild);
            }
        }

        private getIssueList(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.taskItem-titleWrapper-title', issueElement).textContent;
            if (!issueName) {
                return;
            }

            let match = /^(\d+)$/.exec(issueElement.getAttribute('rel'));
            // for new items in list the task id can not be parsed
            if (!match) {
                return;
            }

            let issueId = '#' + match[1];
            let issueUrl = '/#/tasks/' + match[1];
            let projectName: string;

            if ($$('.sidebarItem.active[rel=week]')) {

                // project name for week smart list item
                projectName = $$.try('.taskItem-duedate', issueElement).textContent;
            } else {

                // project name for other smart list item
                let tasks = $$.closest('.tasks', issueElement);
                let heading = tasks && $$.prev('.heading', tasks);
                projectName = heading && heading.textContent;

                if (!projectName) {
                    // project name for list item
                    projectName = $$.try('#list-toolbar .title').textContent;
                }
            }

            let serviceType = 'Wunderlist';

            let serviceUrl = source.protocol + source.host;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }

        private getIssueDetail(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.title-container .display-view', issueElement).textContent;
            if (!issueName) {
                return;
            }

            let match = /^.*\/tasks\/(\d+)(\/.*)?$/.exec(source.fullUrl);
            if (match) {
                var issueId = '#' + match[1];
                var issueUrl = '/#/tasks/' + match[1];
            }

            var projectName = $$.try('#list-toolbar .title').textContent;

            var serviceType = 'Wunderlist';

            var serviceUrl = source.protocol + source.host;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            return (issueElement.id == 'detail' ? this.getIssueDetail : this.getIssueList)(issueElement, source);
        }
    }

    IntegrationService.register(new Wunderlist());
}