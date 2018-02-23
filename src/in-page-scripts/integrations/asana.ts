class Asana implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://app.asana.com/*/*';

    issueElementSelector = [
        '.SingleTaskPane',          // task
        '.SubtaskTaskRow'           // sub-task
    ]

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) {
            let linkContainer = $$.create('div', 'devart-timer-link-asana');
            linkContainer.appendChild(linkElement);
            $$('.SingleTaskTitleRow, .sticky-view-placeholder', issueElement)
                .insertAdjacentElement('afterend', linkContainer);
        }

        if (issueElement.matches(this.issueElementSelector[1])) {
            let container = $$('.ItemRow-right', issueElement);
            linkElement.classList.add('devart-timer-link-minimal');
            container.insertBefore(linkElement, container.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueId: string;
        let issueUrl: string;

        // Project url:
        // https://app.asana.com/0/PROJECT_ID
        // Project task url:
        // https://app.asana.com/0/PROJECT_ID/TASK_ID
        // Project search url:
        // https://app.asana.com/0/search/PROJECT_ID/TASK_ID
        let match = /^\/(\w+)(\/search)?\/(\d+)\/(\d+)(\/f)?$/.exec(source.path);
        if (match) {
            issueId = '#' + match[4];
            issueUrl = '/0/0/' + match[4];
        }

        let rootIssueElement = issueElement.closest(this.issueElementSelector[0]);
        if (!rootIssueElement) {
            return;
        }

        let issueName = $$.try<HTMLTextAreaElement>('.SingleTaskTitleRow .simpleTextarea', rootIssueElement).value || // new layout
            $$.try<HTMLTextAreaElement>('#details_property_sheet_title', rootIssueElement).value; // old layout

        if (!issueName) {
            return;
        }

        let description: string;

        if (issueElement.matches(this.issueElementSelector[1])) {

            description = $$.try<HTMLTextAreaElement>('.SubtaskTaskRow textarea', issueElement).value;

            // prevent adding timer button to the empty sub-task (empty sub-task has no description)
            if (!description) {
                return;
            }
        }

        let projectName =
            $$.try('.TaskProjectToken-projectName').textContent || // new layout task project token
            $$.try('.TaskProjectPill-projectName').textContent || // new layout task project pill
            $$.try('.TaskAncestry-ancestorProject').textContent || // new layout subtask project
            $$.try('.tokens-container .token_name').textContent || // old layout task project
            $$.try('.ancestor-projects .token').textContent; // old layout subtask project

        let serviceType = 'Asana';
        let serviceUrl = source.protocol + source.host;

        let tagNames = $$.all('.TaskTags .Token').map(label => label.textContent);

        return { issueId, issueName, projectName, serviceType, description, serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new Asana());