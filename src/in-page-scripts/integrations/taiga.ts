class TaigaIntegration implements WebToolIntegration {

    observeMutations = true;

    showIssueId = true;

    matchUrl = /(.+)(\/project\/[^\/]+\/[^\/]+\/(\d+))/;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('.sidebar.ticket-data');
        if (!host) {
            return;
        }

        let linkContainer = $$.create('section');
        linkContainer.appendChild(linkElement);
        host.insertBefore(linkContainer, host.firstElementChild);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.detail-header-container .detail-subject').textContent;
        if (!issueName) {
            return;
        }

        let projectName = $$.try('.detail-header-container .project-name').textContent;

        // https://taiga.some.server/project/PROJECT_NAME/TASK_TYPE/NUMBER
        let match = this.matchUrl.exec(source.fullUrl);
        let serviceType = 'Taiga';
        let serviceUrl = match[1];
        let issueUrl = match[2];
        let issueId = '#' + match[3];

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new TaigaIntegration());