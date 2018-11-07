class ActiveCollab implements WebToolIntegration {

    matchUrl = '*://*/projects/*';

    showIssueId = true;

    observeMutations = true;

    issueElementSelector = [
        '.object_view_main' // task
    ]

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('div.object_view_sidebar');
        if (host) {
            let newdiv = $$.create('div', 'page_section', 'with_padding');
            newdiv.appendChild(linkElement);
            host.appendChild(newdiv);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = (<any>$$.try('#project_task .task_name')).textContent;
        if (!issueName) {
            return;
        }

        let issueId = (<any>$$.try('#project_task span[ng-bind="task.task_number"]')).textContent;
        if (issueId) {
            issueId = '#' + issueId;
        }

        let projectName = (<any>$$.try('#project_task a[data-qa-id="task-project-label-name"]')).textContent;
        let serviceUrl = source.protocol + source.host;
        let serviceType = 'ActiveCollab';
        let issueUrl: string;
        if (issueId && projectName) {
            issueUrl = $$.getRelativeUrl(serviceUrl, source.fullUrl);
        }

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new ActiveCollab());