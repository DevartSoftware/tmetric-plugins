module Integrations {

    class BasecampTodos implements WebToolIntegration {

        observeMutations = true;

        matchUrl = [
            '*://*basecamp.com/*/buckets/*/todosets/*',
            '*://*basecamp.com/*/buckets/*/todolists/*'
        ];

        issueElementSelector = '.todos .edit_todo';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.submit', issueElement);
            if (host) {
                linkElement.classList.add('action_button', 'small', 'devart-timer-link-basecamp');
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            // Urls:
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todosets/TODOSET_ID
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todolists/TODOLIST_ID

            var match = /^\/(\d+)\/buckets\/(\d+)\/(todosets|todolists)\/(\d+)$/.exec(source.path);

            var result;

            if (match) {

                var issueUrl = (<HTMLFormElement>issueElement).action;
                if (!issueUrl) {
                    return;
                }
                issueUrl = issueUrl.replace(/^.*:\/\/[^\/]*\//, '').replace(/^\//, '');

                var issueId = issueUrl.split('/todos/')[1];
                if (!issueId) {
                    return;
                }
                issueId = '#' + issueId;

                var issueName = $$<HTMLTextAreaElement>('.todos-form__input--summary', issueElement, true).value;
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

    class BasecampTodo implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*basecamp.com/*/buckets/*/todos/*';

        issueElementSelector = '.panel--perma';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.perma-toolbar', issueElement);
            if (host) {
                linkElement.classList.add('action_button', 'small', 'devart-timer-link-basecamp');
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            // Url:
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todos/TODO_ID

            var match = /^\/(\d+)\/buckets\/(\d+)\/todos\/(\d+)$/.exec(source.path);

            var result;

            if (match) {

                var issueUrl = source.path;
                if (!issueUrl) {
                    return;
                }
                issueUrl = issueUrl.replace(/^.*:\/\/[^\/]*\//, '').replace(/^\//, '');

                var issueId = issueUrl.split('/todos/')[1];
                if (!issueId) {
                    return;
                }
                issueId = '#' + issueId;

                var issueName = $$<HTMLTextAreaElement>('.todos-form__input--summary', issueElement, true).value || $$('.checkbox__content h1', issueElement, true).textContent;
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

    IntegrationService.register(new BasecampTodos());
    IntegrationService.register(new BasecampTodo());
}