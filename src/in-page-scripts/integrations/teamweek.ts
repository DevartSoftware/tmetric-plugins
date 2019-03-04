class Teamweek implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    // Workspace task url:
    // https://app.teamweek.com/#timeline/task/WORKSPACE_ID/TASK_ID
    matchUrl = '*://app.teamweek.com/#timeline*';

    issueElementSelector = '.timeline-task-modal';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('[data-hook="row-actions"]', issueElement);
        if (host) {
            linkElement.classList.add('row', 'row--align-center', 'font-tiny');
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        var issueName = $$.try<HTMLInputElement>('input[name=name]', issueElement).value;
        if (!issueName) {
            return;
        }

        var match = /^(.+)\/(#timeline\/\d+\/tasks)\/(\d+)$/.exec(source.fullUrl);
        if (match) {
            var issueId = '#' + match[3];
            var issueUrl = match[2] + '/' + match[3];
        }

        var projectName = $$.try<HTMLInputElement>('input[name=project_name]', issueElement).value;

        var serviceType = 'Teamweek';
        var serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Teamweek());