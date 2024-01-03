class Bitrix24 implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://*/*/tasks*'; // url of iframe

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const host = $$('[data-bx-id="task-view-b-buttonset"]');
        if (host) {
            linkElement.classList.add('webform-small-button', 'webform-small-button-transparent')
            host.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const issueName = $$.try('#pagetitle').textContent;

        if (!issueName) {
            return;
        }

        let issueUrl: string | undefined;
        let issueId: string | undefined;

        const matches = source.fullUrl.match(/(?:company|workgroups)\/.*\/task\/view\/(\d+)/);

        if (matches) {
            issueId = matches[1];
            issueUrl = '/company/personal/user/0/tasks/task/view/' + issueId + '/';
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Bitrix24';

        const projectName = $$.try('.task-detail-extra .task-group-field').textContent;

        return {
            issueId, issueName, issueUrl, serviceUrl, projectName, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new Bitrix24());