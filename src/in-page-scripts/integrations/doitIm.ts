class DoitIm implements WebToolIntegration {

    showIssueId = false;

    // https://i.doit.im/home/#/task/99999999-aaaa-bbbb-cccc-dddddddddddd
    // https://i.doit.im/home/#/project/99999999-aaaa-bbbb-cccc-dddddddddddd
    // https://i.doit.im/home/#/goal/99999999-aaaa-bbbb-cccc-dddddddddddd
    matchUrl = new RegExp(`(https://i.doit.im)(/home/#/[a-z]+/([a-z0-9\-]+))`);

    issueElementSelector = () => [$$.visible('.task-view, #project_info, #goal_info')];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        const toolbar = $$('li.task-op, li.project-op, li.goal-op', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn-4');
            toolbar.insertBefore(linkElement, toolbar.firstChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const matches = source.fullUrl.match(this.matchUrl)!;
        const serviceUrl = matches[1];
        const issueUrl = matches[2];
        const issueId = matches[3];

        const issueName = $$.try('span.title', issueElement).textContent;
        const projectElement = $$.visible('.project, .goal', issueElement);
        const projectName = projectElement?.textContent?.replace(/^[#@]/, '');
        const tagNames = $$.all('.tags .tag', issueElement).map(_ => _.textContent);
        const serviceType = 'Doit.im';

        return {
            issueId, issueName, issueUrl, serviceUrl, projectName, tagNames, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new DoitIm());