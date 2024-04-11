class Clickup implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://app.clickup.com';

    issueElementSelector = [
        '.task',
        '.lv-subtask__outer', // subtask list item
        '.checklist2-row', // check list item
        '.cu-task-view__container',
        '.cu-task-row'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('devart-timer-link-clickup');
        if (issueElement.matches(this.issueElementSelector[0])) {
            let element = $$('.task__toolbar:nth-last-of-type(1) .task__toolbar-container', issueElement); // v 2.0
            if (element) {
                element.insertBefore(linkElement, element.lastElementChild);
            } 
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.task-todo-item__name-text .task-todo-item__actions', issueElement); // v 2.0
            if (element) {
                element.parentElement!.insertBefore(linkElement, element);
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.checklist2-row-item-name', issueElement); // v 2.0
            if (element) {
                element.parentElement!.insertBefore(linkElement, element.nextElementSibling);
            } 
        } else if (issueElement.matches(this.issueElementSelector[3])) {
            let element = $$('.cu-task-view-header__right.ng-star-inserted', issueElement); // v 3.0
            if (element) {
                element.insertBefore(linkElement, element.firstElementChild);
            } 
        } else if (issueElement.matches(this.issueElementSelector[4])) {
            let element = $$('.cu-task-row-main__link', issueElement); // v 3.0
            if (element) {
                element.appendChild(linkElement);
            }
            element = $$('.cu-task-row__actions', issueElement); // v 3.0
            if (element) {
                element.insertBefore(linkElement, element.firstElementChild);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const serviceType = 'ClickUp';

        const serviceUrl = source.protocol + source.host;

        let issueId = issueElement.getAttribute('data-id');
        if (!issueId) {
            const matches = source.fullUrl.match(/\/t\/([^\/]+)$/);
            if (matches) {
                issueId = matches[1];
            } else {
                issueId = $$.getAttribute('.task-container[data-task-id]', 'data-task-id') ||
                    $$('.cu-task-view__container #timeTrackingItem', issueElement)?.dataset.taskId ||
                    $$('.task-name', issueElement)?.dataset.taskId ||
                    null;
            }
        }

        let issueName = $$.try('.task-name__overlay').textContent
            || $$.try('.cu-task-title__overlay', issueElement).textContent//v 3.0 - task detail page
            || $$.try('.cu-task-row-main__link-text-inner', issueElement).textContent; //v 3.0 - tasks list
        let tags = $$.all('.cu-tags-view__container .cu-tags-view .cu-tags-select__name', issueElement);

        if (tags.length == 0 && issueElement.matches(this.issueElementSelector[3])) {
            tags = $$.all('.cu-task-hero-section__row-item .cu-tags-select__name', issueElement); //v 3.0 - task detail page
        }
        if (tags.length == 0 && issueElement.matches(this.issueElementSelector[4])) {
            tags = $$.all('.cu-tags-view__item .cu-tags-select__name', issueElement); //v 3.0 - tasks list
        }

        let description: string | null | undefined;
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

        let projectName = $$.try('.breadcrumbs__link[data-category]').textContent;

        if (!projectName) {
            let elements = $$.all('.cu-task-view-breadcrumbs__text')
            let breadcrimsItems = elements.map(x => x.textContent);
            projectName = breadcrimsItems[breadcrimsItems.length - 2];
        }

        if (!projectName) {
            projectName = $$.try('.location-title').textContent;
        }

        const tagNames = tags.map(_ => _.textContent);
        const issueUrl = issueId && ('/t/' + issueId);

        return {
            serviceType, serviceUrl, issueId, issueName, issueUrl, description, projectName, tagNames
        } as WebToolIssue;
    }
}

IntegrationService.register(new Clickup());