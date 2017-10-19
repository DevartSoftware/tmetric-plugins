class Bitrix24 implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://*.bitrix24.com/*/tasks*'; // url of iframe

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('[data-bx-id="task-view-b-buttonset"]');
        if (host) {
            linkElement.classList.add('webform-small-button', 'webform-small-button-transparent')
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.tasks-iframe-header #pagetitle').textContent;
        if (!issueName) {
            return;
        }

        let issueUrl: string;
        let issueId: string;

        let matches = source.fullUrl.match(/\/company\/.*\/task\/view\/(\d+)/);

        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;

        let projectName = $$.try('.task-detail-extra .task-group-field').textContent;

        return { issueId, issueName, issueUrl, serviceUrl, projectName, serviceType: 'Bitrix24' };
    }
}

IntegrationService.register(new Bitrix24());