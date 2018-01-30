class OpenProject implements WebToolIntegration {

    showIssueId = true;

    matchUrl = /(https:\/\/.+\.openproject\.com).*(\/work_packages\/(\d+))/;

    match(source: Source): boolean {
        return $$.getAttribute('body', 'ng-app') == 'openproject';
    }

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('#toolbar-items');
        if (host) {
            var container = $$.create('li', 'toolbar-item');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let match = source.fullUrl.match(this.matchUrl)
        let serviceUrl = match[0];
        let issueUrl = match[1];
        let issueId = '#' + match[2];
        let issueName = $$.try('span.subject').textContent;
        let projectName =
            $$.try('#projects-menu').textContent ||
            $$.try('.-project-context span a').textContent;

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'OpenProject' };
    }
}

IntegrationService.register(new OpenProject());