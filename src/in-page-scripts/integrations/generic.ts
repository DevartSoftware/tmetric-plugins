class Generic implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    issueElementSelector = '.tmetric-button';

    match(source: Source): boolean {
        return !!$$('.tmetric-button');
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        issueElement.appendChild(linkElement);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueId = issueElement.getAttribute('data-issue-id');
        let issueName = issueElement.getAttribute('data-issue-name');
        let serviceUrl = issueElement.getAttribute('data-service-url');
        let issueUrl = issueElement.getAttribute('data-issue-url');
        let projectName = issueElement.getAttribute('data-project-name');

        let tagNames: string[];
        let tagNamesAttribute = issueElement.getAttribute('data-tag-names');
        if (tagNamesAttribute) {
            tagNames = tagNamesAttribute.split(',');
        }

        return {
            issueId,
            issueName,
            issueUrl,
            projectName,
            serviceUrl,
            serviceType: 'Generic',
            tagNames
        };
    }
}

IntegrationService.register(new Generic());