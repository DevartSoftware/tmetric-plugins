class OpenProject implements WebToolIntegration {

    showIssueId = true;

    matchUrl = [
        '*://*.openproject.com/projects/*/work_packages/*',
        '*://*.openproject.com/work_packages/*'
    ];

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
        let issueId = $$.try('.work-packages--info-row span')[0].textContent;
        let issueName = $$.try('span.subject').textContent;
        let serviceUrl = source.protocol + source.host;
        let issueUrl = source.path;
        let projectName =
            $$.try('#projects-menu .button--dropdown-text').textContent ||
            $$.try('.-project-context span a').textContent;
        let tagNames = $$.all('.labels').map(label => label.textContent);

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'OpenProject', tagNames };
    }
}

IntegrationService.register(new OpenProject());