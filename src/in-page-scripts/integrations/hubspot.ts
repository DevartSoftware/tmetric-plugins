class Hubspot implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://*.hubspot.com/*';

    issueElementSelector = [
        '[data-selenium-test="edit-task-panel"]',
        '[data-selenium-test="timeline-card"]'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('private-button', 'private-button--default', 'devart-timer-link-text-only');

        // task side panel
        if (issueElement.matches(this.issueElementSelector[0])) {
            const taskForm = $$('[data-selenium-test="task-form"]', issueElement);
            if (taskForm) {
                linkElement.classList.add('private-button--secondary');
                taskForm.prepend(linkElement);
            }
        }

        // tasks on the contact/ticket page
        if (issueElement.matches(this.issueElementSelector[1])) {
            const taskBody = $$('[aria-label="Task Options"]', issueElement);
            if (taskBody) {
                linkElement.classList.add('private-button--tertiary-light');
                const li = $$.create('li');
                li.classList.add('devart-timer-link-hubspot-li');
                li.append(linkElement);
                taskBody.append(li);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueName: string | undefined | null;
        let issueId: string | undefined | null;
        let issueUrl: string | undefined;
        let accountId: string | undefined | null;

        // task side panel
        if (issueElement.matches(this.issueElementSelector[0])) {
            const taskSubject = $$('[data-field="hs_task_subject"]', issueElement);
            if (taskSubject) {
                issueName = (taskSubject as HTMLInputElement).value;
            }
            const match = source.path.match(/tasks\/(\d+)\/view\/[^\/]+\/task\/(\d+)/);
            accountId = match && match[1];
            issueId = match && match[2];
        }

        // tasks on the contact/ticket page
        else if (issueElement.matches(this.issueElementSelector[1])) {
            issueName = $$.try('[data-selenium-test="timeline-editable-title"]', issueElement).textContent;
            const actionsBtn = $$('[data-selenium-test="timeline-header-actions"]', issueElement);
            issueId = actionsBtn && actionsBtn.dataset.seleniumId;
            const match = issueId && source.path.match(/contacts\/(\d+)\//);
            accountId = match && match[1];
        }

        if (accountId && issueId) {
            issueUrl = `tasks/${accountId}/view/all/task/${issueId}`;
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'HubSpot';

        return {
            issueId, issueName, issueUrl, serviceUrl, serviceType
        } as WebToolIssue
    }
}

IntegrationService.register(new Hubspot());