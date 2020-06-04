class Hubspot implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = 'https://app.hubspot.com/*';

    issueElementSelector = [
        '.private-panel__container',
        '[data-selenium-test="timeline-task"]'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('private-button', 'private-button--default');
        linkElement.firstChild.remove();

        // task side panel
        if (issueElement.matches(this.issueElementSelector[0])) {
            let taskForm = $$('[data-selenium-test="task-form"]', issueElement);
            if (taskForm) {
                linkElement.classList.add('private-button--secondary');
                taskForm.firstChild.before(linkElement);
            }
        }

        // tasks on the contact page
        if (issueElement.matches(this.issueElementSelector[1])) {
            let taskBody = $$('.uiList.private-list--inline', issueElement);
            if (taskBody) {
                linkElement.classList.add('private-button--tertiary-light');
                let li = $$.create('li');
                li.classList.add('devart-timer-link-hubspot-li');
                li.append(linkElement);
                taskBody.append(li);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueName: string;
        let issueId: string;
        let issueUrl: string;

        // task side panel
        if (issueElement.matches(this.issueElementSelector[0])) {
            let taskSubject = $$('[data-field="hs_task_subject"]', issueElement);
            if (taskSubject) {
                let taskSubject = $$('[data-field="hs_task_subject"]', issueElement);
                issueName = (taskSubject as HTMLInputElement).value;
            }

            issueId = $$.searchParams(source.fullUrl)['taskId'];
            issueUrl = issueId && `${source.path}?taskId=${issueId}`;
        }

        // tasks on the contact page
        if (issueElement.matches(this.issueElementSelector[1])) {
            issueName = $$.try('[data-selenium-test="timeline-editable-title"]', issueElement).textContent;
            var pinBtn = $$('[data-selenium-test="timeline-pin-engagement-button"]', issueElement);
            issueId = pinBtn && pinBtn.dataset.seleniumId;
            let match = issueId && source.path.match('(\/contacts/([^\/]*)\/)');
            issueUrl = match && `${match[0]}tasks/list/view/all/?taskId=${issueId}`;
        }

        let serviceUrl = source.protocol + source.host;

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'HubSpot' }
    }
}

IntegrationService.register(new Hubspot());