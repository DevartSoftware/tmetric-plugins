class ActiveCollab implements WebToolIntegration {

    matchUrl = '*://*/projects/*';

    showIssueId = true;

    issueElementSelector = [
        '.object_view' // task
    ]

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const host = $$('div.object_view_sidebar');
        if (host) {
            const newdiv = $$.create('div', 'page_section', 'with_padding');
            newdiv.appendChild(linkElement);
            host.appendChild(newdiv);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const issueName = (<any>$$.try('#project_task .task_name')).textContent;
        if (!issueName) {
            return;
        }

        let issueId = (<any>$$.try('#project_task span[ng-bind="task.task_number"]')).textContent;
        if (issueId) {
            issueId = '#' + issueId;
        }

        const projectName = (<any>$$.try('#project_task a[data-qa-id="task-project-label-name"]')).textContent;
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'ActiveCollab';
        let issueUrl: string | undefined;
        if (issueId && projectName) {
            issueUrl = $$.getRelativeUrl(serviceUrl, source.fullUrl);
        }

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new ActiveCollab());