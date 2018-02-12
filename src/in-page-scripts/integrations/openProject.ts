class OpenProject {

    showIssueId = true;

    matchUrl = /(https:\/\/.+\.openproject\.com).*\/work_packages\/\D*(\d+)/;

    match(source: Source): boolean {
        return $$.getAttribute('body', 'ng-app') == 'openproject';
    }

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let detailedView = $$('.work-package--single-view');
        if (detailedView) {
            let infoWrapper = $$('.wp-info-wrapper');
            if (infoWrapper) {
                let container = $$.create('div');
                container.classList.add('devart-timer-link-openproject-container')
                container.appendChild(linkElement);
                detailedView.insertBefore(container, infoWrapper.nextElementSibling)
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let match = source.fullUrl.match(this.matchUrl)
        let serviceUrl = match[1];
        let issueUrl = '/work_packages/' + match[2];
        let issueId = '#' + match[2];
        let issueName = $$.try('.work-packages--subject-type-row span.subject').textContent;
        let projectName =
            $$.try('#projects-menu').textContent ||
            $$.try('.-project-context span a').textContent;

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'OpenProject' };
    }
}

IntegrationService.register(new OpenProject());