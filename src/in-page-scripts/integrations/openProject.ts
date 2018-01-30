class OpenProject implements WebToolIntegration {

    showIssueId = true;

    matchUrl = /(.+\.openproject\.com)(.*\/work_packages\/.*(\d+)).*/;

    match(source: Source): boolean {
        return $$.getAttribute('body', 'ng-app') == 'openproject';
    }

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('#toolbar-items, .toolbar-items');
        if (host) {
            var container = $$.create('li', 'toolbar-item');
            linkElement.classList.add('button', 'devart-timer-link-openproject');
            container.appendChild(linkElement);
            host.insertBefore(container, host.lastElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let match = source.fullUrl.match(this.matchUrl)
        let serviceUrl = match[1];
        let issueUrl = match[2];
        let issueId = '#' + match[3];
        let issueName = $$.try('.work-packages--subject-type-row span.subject').textContent;
        let projectName =
            $$.try('#projects-menu').textContent ||
            $$.try('.-project-context span a').textContent;

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'OpenProject' };
    }
}

IntegrationService.register(new OpenProject());