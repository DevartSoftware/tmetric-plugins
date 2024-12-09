class Asana implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://app.asana.com/*/*';

    issueElementSelector = [
        '.TaskPane .TaskPaneToolbar', // task
        '.TaskPane .SubtaskTaskRow' // sub-task
    ]

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) {
            const linkContainer = $$.create('div', 'devart-timer-link-asana');
            linkContainer.appendChild(linkElement);
            const elementToAdd = $$('.TaskPaneToolbar-button', issueElement);
            elementToAdd?.parentElement?.insertBefore(linkContainer, elementToAdd);
        } else {
            const container = $$('.SubtaskTaskRow-childContainer--rightChildren', issueElement);
            linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-asana-subtask');
            container?.insertBefore(linkElement, container.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const getIdFromUrl = (fullUrl: string) => {
            if (!fullUrl) {
                return;
            }
            let [, relativePath, queryString] = fullUrl.match(/https:\/\/[^\/]+([^?]*)(\?.*)?/) || [];
            // project task url:
            // https://app.asana.com/0/234567890123456/1234567890123456
            // project search url:
            // https://app.asana.com/0/search/234567890123456/1234567890123456
            // widget from home page:
            // https://app.asana.com/0/home/765432109876544/1234567890123456
            let id = /^\/\w+(?:\/search|\/home|\/inbox)?\/\d+\/(\d+)/.exec(relativePath)?.[1];
            if (id) {
                return id;
            }
            // task search:
            // https://app.asana.com/0/search?q=Foo&searched_type=task&child=1234567890123456
            return new URLSearchParams(queryString).get('child');
        }

        let issueName: string | undefined | null;
        let description: string | undefined | null;
        let id = getIdFromUrl(source.fullUrl);

        let taskPane = $$.closest('.TaskPane', issueElement)!;
        issueName = $$<HTMLTextAreaElement>('.TitleInput .SimpleTextarea, .TitleInput textarea', taskPane)?.value;

        let rootTaskLink = $$<HTMLAnchorElement>('.TaskAncestry a.TaskAncestryBreadcrumb-navigationLink', taskPane);
        if (rootTaskLink) {
            let rootName = rootTaskLink.textContent
            let rootId = getIdFromUrl(rootTaskLink.href);
            if (rootName && rootId) {
                description = issueName;
                issueName = rootName;
                id = rootId;
            }
        }
        
        if (issueElement.matches(this.issueElementSelector[1])) {
            description = $$('textarea', issueElement)?.textContent;
        }
        
        let issueId = id && ('#' + id);
        let issueUrl = id && ('/0/0/' + id);

        const projectName =
            $$.try('.TaskProjectTokenPill-name').textContent || // task project name for latest Asana
            $$.try('.TaskProjectToken-projectName').textContent || // task project token
            $$.try('.TaskProjectPill-projectName, .TaskProjectToken-potTokenizerPill').textContent || // task project pill
            $$.try('.TaskAncestry-ancestorProject').textContent; // subtask project

        const serviceType = 'Asana';
        const serviceUrl = source.protocol + source.host;

        const tagNames = $$
            .all('.TaskTags .Token, .TaskTags .TaskTagTokenPills-potPill')
            .map(label => label.textContent);

        return {
            issueId, issueName, projectName, serviceType, description, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }
}

IntegrationService.register(new Asana());
