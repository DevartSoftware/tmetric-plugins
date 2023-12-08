class Generic implements WebToolIntegration {

    showIssueId = true;

    issueElementSelector = '.tmetric-button';

    match() {
        return !!$$('.tmetric-button');
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        issueElement.appendChild(linkElement);
    }

    getIssue(issueElement: HTMLElement, source: Source) {
        const issueId = issueElement.getAttribute('data-issue-id');
        const issueName = issueElement.getAttribute('data-issue-name');
        const serviceUrl = issueElement.getAttribute('data-service-url');
        const issueUrl = issueElement.getAttribute('data-issue-url');
        const projectName = issueElement.getAttribute('data-project-name');
        const serviceType = 'Generic';

        let tagNames: string[] | undefined;
        const tagNamesAttribute = issueElement.getAttribute('data-tag-names');
        if (tagNamesAttribute) {
            tagNames = tagNamesAttribute.split(',');
        }

        return {
            issueId,
            issueName,
            issueUrl,
            projectName,
            serviceUrl,
            serviceType,
            tagNames
        } as WebToolIssue;
    }
}

IntegrationService.register(new Generic());