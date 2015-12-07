module Integrations {
    class Basecamp implements WebToolIntegration {
        observeMutations = true

        matchUrl = [
            '*://3.basecamp.com/*/buckets/*/todosets/*',
            '*://3.basecamp.com/*/buckets/*/todolists/*',
            '*://3.basecamp.com/*/buckets/*/todos/*'
        ]

        issueElementSelector = null

        match(source: Source): boolean {
            if (source.path.indexOf('/todos/') > -1) {
                this.issueElementSelector = '.panel--perma';
            } else if (source.path.indexOf('/todosets/') > -1 || source.path.indexOf('/todolists/') > -1) {
                this.issueElementSelector = '.todos .edit_todo';
            } else {
                this.issueElementSelector = null;
            }
            return !!this.issueElementSelector;
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = issueElement.classList.contains('panel--perma') ? $$('.perma-toolbar', issueElement) : $$('.submit', issueElement);
            if (host) {
                linkElement.classList.add('action_button', 'small', 'devart-timer-link-basecamp');
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            // Urls:
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todosets/TODOSET_ID
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todolists/TODOLIST_ID
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todos/TODO_ID

            var match = /^\/(\d+)\/buckets\/(\d+)\/(todosets|todolists|todos)\/(\d+)$/.exec(source.path);

            var result;

            if (match) {

                var issueUrl = source.path.indexOf('/todos/') > -1 ? source.path : (<HTMLFormElement>issueElement).action;
                if (!issueUrl) {
                    return;
                }
                issueUrl = issueUrl.replace(/^.*:\/\/[^\/]*\//, '').replace(/^\//, '');

                var issueId = issueUrl.split('/todos/')[1];
                if (!issueId) {
                    return;
                }
                issueId = '#' + issueId;

                var issueName = (<HTMLTextAreaElement>$$('.todos-form__input--summary', issueElement, true)).value ||
                    $$('.checkbox__content h1', issueElement, true).textContent;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                var projectName = $$('.project-header__name a', true).textContent;
                if (projectName) {
                    projectName = projectName.trim();
                }

                var serviceType = 'Basecamp';

                var serviceUrl = source.protocol + source.host + source.path.split(match[1])[0];

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
            }
            return result;
        }
    }

    IntegrationService.register(new Basecamp());
}