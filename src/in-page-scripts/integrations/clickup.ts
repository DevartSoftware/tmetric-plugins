class Clickup implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://*.clickup.com';

    issueElementSelector = [
        '.cu-checklist-item__row', // v3 v4 check list item
        '.cu-task-view__container', // v3 task view
        '.cu-task-row', // v3 v4 tasks list
        '.cu-task-view__main' // v4 task view
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('devart-timer-link-clickup');

        if (issueElement.matches(this.issueElementSelector[0])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.cu-checklist-item__name', issueElement);
            if (element) {
                element.parentElement!.insertBefore(linkElement, element.nextElementSibling);
            } 
        } else if (issueElement.matches(this.issueElementSelector[1]) || issueElement.matches(this.issueElementSelector[3])) {
            let element = $$('.cu-task-view-header__right', issueElement);
            if (element) {
                element.insertBefore(linkElement, element.firstElementChild);
            } 
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            let element = $$('.cu-task-row-main__actions', issueElement);
            if (element) {
                element.appendChild(linkElement);
            }
            element = $$('.cu-task-row__actions', issueElement);
            if (element) {
                element.insertBefore(linkElement, element.firstElementChild);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const serviceType = 'ClickUp';

        const serviceUrl = source.protocol + source.host;

        let issueId = issueElement.getAttribute('data-id');
        if (!issueId || issueElement.matches(this.issueElementSelector[0])) {
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

        let issueName = $$.try('.cu-task-title__overlay', issueElement).textContent // task detail page
            || $$.try('.cu-task-row-main__link-text-inner', issueElement).textContent // tasks list
            || $$.try('cu-task-hero-section .cu-task-title__overlay').textContent // checklist-item

        let tags = $$.all('cu-tags-list .cu-tags-select__name', issueElement);
        if (tags.length == 0 && issueElement.matches(this.issueElementSelector[0])) {
            tags = $$.all('cu-task-hero-section .cu-tags-select__name');
        }

        let description: string | null | undefined;
        if (issueElement.matches(this.issueElementSelector[0])) {
            description = $$.try('.cu-checklist-item__name', issueElement).textContent;
        }

        let projectName = $$.try('.breadcrumbs__link[data-category]').textContent;

        if (!projectName) {
            let elements = $$.all('.cu-task-view-breadcrumbs__v4morelists');
            let breadcrumbsItems = elements.map(x => x.textContent);
            projectName = breadcrumbsItems[breadcrumbsItems.length - 1];
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