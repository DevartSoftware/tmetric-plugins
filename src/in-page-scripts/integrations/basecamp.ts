class BasecampBase {

    showIssueId = false;

    observeMutations = true;

    getIssueUrl(issueElement: HTMLElement, source: Source): string {
        return null;
    }

    getIssueName(issueElement: HTMLElement): string {
        return null;
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

        var serviceUrl = source.protocol + source.host;

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

        var issueName = this.getIssueName(issueElement);
        if (!issueName) {
            return;
        }

        var projectName = $$.try('[data-target="breadcrumbs.link"]').textContent;

        var serviceType = 'Basecamp';

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

class BasecampTodo extends BasecampBase implements WebToolIntegration {

    matchUrl = '*://*basecamp.com/*/buckets/*/todos/*';

    issueElementSelector = '.panel--perma';

    getIssueUrl(issueElement: HTMLElement, source: Source) {
        return source.path;
    }

    getIssueName(issueElement: HTMLElement) {
        return $$.try('h1', issueElement).textContent
            || $$.try<HTMLTextAreaElement>('.todos-form__title', issueElement).value // issue in edit mode
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.perma-toolbar', issueElement);
        if (host) {
            linkElement.classList.add('btn', 'btn--small', 'devart-timer-link-basecamp');
            host.insertBefore(linkElement, host.firstElementChild);
        }
    }
}

class BasecampTodos extends BasecampBase implements WebToolIntegration {

    matchUrl = [
        '*://*basecamp.com/*/buckets/*/todosets/*',
        '*://*basecamp.com/*/buckets/*/todolists/*'
    ];

    issueElementSelector = [
        '.todo',
        '.todos-form--todo' // issue in edit mode
    ];

    getIssueUrl(issueElement: HTMLElement, source: Source) {
        return (<HTMLAnchorElement>$$.try('.checkbox__content > a', issueElement)).href
            || (<HTMLFormElement>$$.try('form', issueElement)).action; // issue in edit mode
    }

    getIssueName(issueElement: HTMLElement) {
        return $$.try('.checkbox__content > a', issueElement).textContent
            || $$.try<HTMLTextAreaElement>('.todos-form__title', issueElement).value; // issue in edit mode
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        var host = $$('.checkbox__content > a', issueElement);
        if (host) {
            linkElement.classList.add('text-toggle', 'devart-timer-link-basecamp');
            host.parentElement.insertBefore(linkElement, $$('.todo__unassigned-unscheduled', host.parentElement));
            return;
        }

        // issue in edit mode
        var host = $$('form .submit', issueElement);
        if (host) {
            linkElement.classList.add('btn', 'btn--small', 'devart-timer-link-basecamp');
            host.appendChild(linkElement);
            return;
        }
    }
}

IntegrationService.register(new BasecampTodo(), new BasecampTodos());