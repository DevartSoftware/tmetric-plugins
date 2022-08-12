class Asana implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://app.asana.com/*/*';

    issueElementSelector = [
        '.TaskPane',      // task
        '.SubtaskTaskRow' // sub-task
    ]

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) {
            const linkContainer = $$.create('div', 'devart-timer-link-asana');
            linkContainer.appendChild(linkElement);
            const toolbar = $$('.TaskPaneToolbar', issueElement);
            if (toolbar) {
                toolbar.insertBefore(linkContainer, $$('.TaskPaneToolbar-button', toolbar));
            }
        }

        if (issueElement.matches(this.issueElementSelector[1])) {
            const container = $$('.ItemRowTwoColumnStructure-right', issueElement);
            linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-asana-subtask');
            container.insertBefore(linkElement, container.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let description: string;

        // Find root task
        const rootTaskPane = $$.closest(this.issueElementSelector[0], issueElement);
        if (!rootTaskPane) {
            return;
        }

        let issueName = ($$.try('.ObjectTitleInput  .simpleTextarea', rootTaskPane) as HTMLTextAreaElement).value;
        let issuePath = source.path;

        // Sub-tasks
        if (issueElement.matches(this.issueElementSelector[1])) {

            // Do not add link to empty sub-task
            description = ($$.try('.SubtaskTaskRow textarea', issueElement) as HTMLTextAreaElement).value;
            if (!description) {
                return;
            }

            // Get root task for sub-sub-tasks
            const rootTask = $$('.TaskAncestry-ancestor a', rootTaskPane) as HTMLAnchorElement;
            if (rootTask) {
                // Get issue name and path
                issueName = rootTask.textContent;
                const match = /:\/\/[^\/]+(\/[^\?#]+)/.exec(rootTask.href);
                if (match) {
                    issuePath = match[1];
                }
            }
        }

        // Project url:
        // https://app.asana.com/0/PROJECT_ID
        // Project task url:
        // https://app.asana.com/0/PROJECT_ID/TASK_ID
        // Project search url:
        // https://app.asana.com/0/search/PROJECT_ID/TASK_ID
        let issueId: string;
        let issueUrl: string;
        const match = /^\/\w+(?:\/search)?\/\d+\/(\d+)/.exec(issuePath);
        if (match) {
            issueId = '#' + match[1];
            issueUrl = '/0/0/' + match[1];
        }

        const projectName =
            $$.try('.TaskProjectToken-projectName').textContent || // task project token
            $$.try('.TaskProjectPill-projectName, .TaskProjectToken-potTokenizerPill').textContent || // task project pill
            $$.try('.TaskAncestry-ancestorProject').textContent; // subtask project

        const serviceType = 'Asana';
        const serviceUrl = source.protocol + source.host;

        const tagNames = $$.all('.TaskTags .Token, .TaskTags .TaskTagTokenPills-potPill').map(label => label.textContent);

        return { issueId, issueName, projectName, serviceType, description, serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new Asana());