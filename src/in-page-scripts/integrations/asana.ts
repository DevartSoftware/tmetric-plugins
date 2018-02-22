class Asana implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = [
        '*://app.asana.com/*/*',
    ];

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

        // Project url:
        // https://app.asana.com/0/PROJECT_ID
        // Project task url:
        // https://app.asana.com/0/PROJECT_ID/TASK_ID
        // Project search url:
        // https://app.asana.com/0/search/PROJECT_ID/TASK_ID
        var match = /^\/(\w+)(\/search)?\/(\d+)\/(\d+)(\/f)?$/.exec(source.path);
        if (match) {
            var issueId = '#' + match[4];
            var issueUrl = '/0/0/' + match[4];
        }

        var issueName = $$.try<HTMLTextAreaElement>('.SingleTaskTitleRow .simpleTextarea', issueElement).value || // new layout
            $$.try<HTMLTextAreaElement>('#details_property_sheet_title', issueElement).value; // old layout

        var description: string;

        if (issueElement.matches(this.issueElementSelector[1])) {
            // get for subtask same to main task issue name
            issueName = $$.try<HTMLTextAreaElement>('.SingleTaskTitleRow .simpleTextarea',
                issueElement.closest(this.issueElementSelector[0])).value || // new layout
                $$.try<HTMLTextAreaElement>('#details_property_sheet_title',
                    issueElement.closest(this.issueElementSelector[0])).value; // old layout

            description = $$.try<HTMLTextAreaElement>('.SubtaskTaskRow textarea', issueElement).value;

            // prevent adding timer button to the empty sub-task (empty sub-task has no description)
            if (!description) {
                return;
            }
        }

        if (!issueName) {
            return;
        }

        var projectName =
            $$.try('.TaskProjectToken-projectName').textContent || // new layout task project token
            $$.try('.TaskProjectPill-projectName').textContent || // new layout task project pill
            $$.try('.TaskAncestry-ancestorProject').textContent || // new layout subtask project
            $$.try('.tokens-container .token_name').textContent || // old layout task project
            $$.try('.ancestor-projects .token').textContent; // old layout subtask project

        var serviceType = 'Asana';
        var serviceUrl = source.protocol + source.host;

        var tagNames = $$.all('.TaskTags .Token').map(label => label.textContent);

        return { issueId, issueName, projectName, serviceType, description, serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new Asana());