class Clickup implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://app.clickup.com';

    issueElementSelector = [
        '.task',
        '.lv-subtask__outer', // subtask list item
        '.checklist2-row' // check list item
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('devart-timer-link-clickup');
        if (issueElement.matches(this.issueElementSelector[0])) {
            let element = $$('.task__toolbar:nth-last-of-type(1) .task__toolbar-container', issueElement); // v 2.0
            if (element) {
                element.insertBefore(linkElement, element.lastElementChild);
            } else {
                element = $$('.task__toolbar:nth-last-of-type(1)', issueElement); // v 1.0
                if (element) {
                    element.insertBefore(linkElement, element.firstElementChild.nextElementSibling);
                }
            }
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.task-todo-item__name-text .task-todo-item__actions', issueElement); // v 2.0
            if (element) {
                element.parentElement.insertBefore(linkElement, element);
            } else {
                element = $$('.task-todo-item__name-text', issueElement); // v 1.0
                if (element) {
                    element.parentElement.insertBefore(linkElement, element.nextElementSibling);
                }
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.checklist2-row-item-name', issueElement); // v 2.0
            if (element) {
                element.parentElement.insertBefore(linkElement, element.nextElementSibling);
            } else {
                element = $$(':scope > p', issueElement); // v 1.0
                if (element) {
                    element.parentElement.insertBefore(linkElement, element.nextElementSibling);
                }
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const serviceType = 'ClickUp';

        const serviceUrl = source.protocol + source.host;

        let issueId: string;
        const matches = source.fullUrl.match(/\/t\/([^\/]+)$/);
        if (matches) {
            issueId = matches[1];
        } else {
            issueId = $$.getAttribute('.task-container[data-task-id]', 'data-task-id');
        }

        let issueName = $$.try('.task-name__overlay').textContent;
        let tags = $$.all('.cu-tags-view__container .cu-tags-view .cu-tags-select__name', issueElement);

        let description: string;
        if (issueElement.matches(this.issueElementSelector[1])) {
            const subtaskLink = $$('.task-todo-item__name-text a', issueElement) as HTMLAnchorElement;
            if (subtaskLink) {
                const matches = subtaskLink.href.match(/\/t\/([^\/]+)$/);
                if (matches) {
                    issueName = subtaskLink.textContent;
                    issueId = matches[1];
                    tags = $$.all('.cu-tags-view__container-list .cu-tags-view .cu-tags-select__name', issueElement);
                }
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            description = $$.try('.checklist2-row-item-name > p, :scope > p', issueElement).textContent; // v 2.0, v 1.0
        }

        const projectName = $$.try('.breadcrumbs__link[data-category]').textContent;

        const tagNames = tags.map(_ => _.textContent);
        const issueUrl = issueId && ('/t/' + issueId);

        return { serviceType, serviceUrl, issueId, issueName, issueUrl, description, projectName, tagNames };
    }
}

IntegrationService.register(new Clickup());