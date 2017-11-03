class Bitrix24 implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://*/*/tasks*'; // url of iframe

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('[data-bx-id="task-view-b-buttonset"]');
        if (host) {
            linkElement.classList.add('webform-small-button', 'webform-small-button-transparent')
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('#pagetitle').textContent;

        if (!issueName) {
            return;
        }

        let issueUrl: string;
        let issueId: string;

        let matches = source.fullUrl.match(/(?:company|workgroups)\/.*\/task\/view\/(\d+)/);

        if (matches) {
            issueId = matches[1];
            issueUrl = '/company/personal/user/0/tasks/task/view/' + issueId + '/';
        }

        var serviceUrl = source.protocol + source.host;

        let projectName = $$.try('.task-detail-extra .task-group-field').textContent;

        return { issueId, issueName, issueUrl, serviceUrl, projectName, serviceType: 'Bitrix24' };
    }
}

IntegrationService.register(new Bitrix24());