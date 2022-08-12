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

        let getChildQueryParam = (url: string) => {
            let searchParams = new URLSearchParams(url);
            return searchParams.get('child');
        }

        let description: string;

        // Find root task
        const rootTaskPane = $$.closest(this.issueElementSelector[0], issueElement);
        if (!rootTaskPane) {
            return;
        }

        let issueName = ($$.try('.ObjectTitleInput  .simpleTextarea', rootTaskPane) as HTMLTextAreaElement).value;
        let id = getChildQueryParam(source.fullUrl);
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
                id = getChildQueryParam(rootTask.href);
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
        // task search
        // https://app.asana.com/0/search?sort=last_modified&predefined=TasksCreatedByMe&child=108409755682607
        if (!id) {
            const match = /^\/\w+(?:\/search)?\/\d+\/(\d+)/.exec(issuePath);
            if (match) {
                id = match[1];
            }
        }

        let issueId: string;
        let issueUrl: string;

        if (id) {
            issueId = '#' + id;
            issueUrl = '/0/0/' + id;
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