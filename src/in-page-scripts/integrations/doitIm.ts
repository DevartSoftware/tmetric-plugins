class DoitIm implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    // https://i.doit.im/home/#/task/99999999-aaaa-bbbb-cccc-dddddddddddd
    // https://i.doit.im/home/#/project/99999999-aaaa-bbbb-cccc-dddddddddddd
    // https://i.doit.im/home/#/goal/99999999-aaaa-bbbb-cccc-dddddddddddd
    matchUrl = new RegExp(`(https://i.doit.im)(/home/#/[a-z]+/([a-z0-9\-]+))`);

    issueElementSelector = () => [$$.visible('.task-view, #project_info, #goal_info')];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let toolbar = $$('li.task-op, li.project-op, li.goal-op', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn-4');
            toolbar.insertBefore(linkElement, toolbar.firstChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let matches = source.fullUrl.match(this.matchUrl);
        let serviceUrl = matches[1];
        let issueUrl = matches[2];
        let issueId = matches[3];

        let issueName = $$.try('span.title', issueElement).textContent;
        let projectElement = $$.visible('.project, .goal', issueElement);
        let projectName = projectElement && projectElement.textContent.replace(/^[#@]/, '');
        let tagNames = $$.all('.tags .tag', issueElement).map(_ => _.textContent);

        return { issueId, issueName, issueUrl, serviceUrl, projectName, tagNames, serviceType: 'Doit.im' };
    }
}

IntegrationService.register(new DoitIm());