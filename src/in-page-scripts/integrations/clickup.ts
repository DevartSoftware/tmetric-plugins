class Clickup implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://app.clickup.com';

    issueElementSelector = [
        '.task__toolbar:nth-last-of-type(1)',
        '.lv-subtask__outer', // subtask list item
        '.checklist-todo-item' // check list item
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('devart-timer-link-clickup');
        if (issueElement.matches(this.issueElementSelector[0])) {
            issueElement.insertBefore(linkElement, issueElement.firstElementChild.nextElementSibling);
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.task-todo-item__name-text', issueElement);
            if (element) {
                element.parentElement.insertBefore(linkElement, element.nextElementSibling);
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.checklist-item__name-block', issueElement);
            if (element) {
                element.parentElement.insertBefore(linkElement, element.nextElementSibling);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let serviceType = 'Clickup';

        let serviceUrl = source.protocol + source.host;

        let issueId: string;
        let issueUrl: string;
        let matches = source.fullUrl.match(/\/t\/([^\/]+)$/);
        if (matches) {
            issueId = matches[1];
            issueUrl = '/t/' + issueId;
        }

        let issueName = $$.try('.task-name__overlay').textContent;

        let description: string;
        if (issueElement.matches(this.issueElementSelector[1])) {
            let subtaskLink = <HTMLAnchorElement>$$('.task-todo-item__name-text a', issueElement);
            if (subtaskLink) {
                let matches = subtaskLink.href.match(/\/t\/([^\/]+)$/);
                if (matches) {
                    issueName = subtaskLink.textContent;
                    issueId = matches[1];
                    issueUrl = '/t/' + issueId;
                }
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            description = $$.try('.checklist-item__name', issueElement).textContent;
        }

        let projectName = $$.try('.breadcrumbs__link:nth-last-of-type(2)').textContent;

        return { serviceType, serviceUrl, issueId, issueName, issueUrl, description, projectName };
    }
}

IntegrationService.register(new Clickup());