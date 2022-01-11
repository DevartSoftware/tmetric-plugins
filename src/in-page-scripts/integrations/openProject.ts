class OpenProject implements WebToolIntegration {

    showIssueId = true;

    matchUrl = /(https?:\/\/[^\/]+).*\/work_packages\/\D*(\d+)/;

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const detailedView = $$('.work-package--single-view');
        if (detailedView) {
            const infoWrapper = $$('.wp-info-wrapper');
            if (infoWrapper) {
                const container = $$.create('div');
                container.classList.add('devart-timer-link-openproject-container')
                container.appendChild(linkElement);
                detailedView.insertBefore(container, infoWrapper.nextElementSibling);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const match = source.fullUrl.match(this.matchUrl);
        const serviceUrl = $$.try<HTMLBaseElement>('base').href || match[1];
        const issueUrl = '/work_packages/' + match[2];
        const issueId = '#' + match[2];
        const issueName = $$.try('.work-packages--subject-type-row span.subject').textContent;
        const projectName =
            $$.try('#projects-menu').textContent ||
            $$.try('.-project-context span a').textContent;
        const serviceType = 'OpenProject';

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
    }
}

IntegrationService.register(new OpenProject());