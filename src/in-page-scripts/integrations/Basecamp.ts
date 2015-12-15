module Integrations {

    class BasecampBase {

        observeMutations = true;

        getIssueUrl(issueElement: HTMLElement, source: Source): string {
            return null;
        }

        hostSelector: string;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$(this.hostSelector, issueElement);
            if (host) {
                linkElement.classList.add('action_button', 'small', 'devart-timer-link-basecamp');
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Urls:
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todos/TODO_ID
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todosets/TODOSET_ID
            // https://3.basecamp.com/ACCOUNT_ID/buckets/PROJECT_ID/todolists/TODOLIST_ID
            var match = /^\/(\d+)\/buckets\/(\d+)\/(todos|todosets|todolists)\/(\d+)$/.exec(source.path);

            if (!match) {
                return;
            }

            var serviceUrl = source.protocol + source.host + source.path.split(match[1])[0];

            var issueUrl = this.getIssueUrl(issueElement, source);
            if (!issueUrl) {
                return;
            }
            issueUrl = $$.getRelativeUrl(serviceUrl, issueUrl);

            var issueId = issueUrl.split('/todos/')[1];
            if (!issueId) {
                return;
            }
            issueId = '#' + issueId;

            var issueName =
                $$.try<HTMLTextAreaElement>('.todos-form__input--summary', issueElement).value ||
                $$.try('.todo h1', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var projectName = $$.try('.project-header__name a').textContent;

            var serviceType = 'Basecamp';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    class BasecampTodo extends BasecampBase implements WebToolIntegration {

        matchUrl = '*://*basecamp.com/*/buckets/*/todos/*';

        issueElementSelector = '.panel--perma';

        hostSelector = '.perma-toolbar';

        getIssueUrl(issueElement: HTMLElement, source: Source): string {
            return source.path;
        }
    }

    class BasecampTodos extends BasecampBase implements WebToolIntegration {

        matchUrl = [
            '*://*basecamp.com/*/buckets/*/todosets/*',
            '*://*basecamp.com/*/buckets/*/todolists/*'
        ];

        issueElementSelector = '.todos .edit_todo';

        hostSelector = '.submit';

        getIssueUrl(issueElement: HTMLElement, source: Source): string {
            return (<HTMLFormElement>issueElement).action;
        }
    }

    IntegrationService.register(new BasecampTodo(), new BasecampTodos());
}