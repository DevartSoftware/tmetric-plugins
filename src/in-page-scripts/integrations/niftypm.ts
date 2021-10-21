class NiftyPM implements WebToolIntegration {

    matchUrl = '*://*.niftypm.com/*';

    issueElementSelector = '.content-panel-controls';

    observeMutations = true;


    /**
     * Extracts information about the issue (ticket or task) from a Web
     * page by querying the DOM model.
     */
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
            serviceType: 'NiftyPM',
            tagNames
        };
    }

    /**
     * Inserts the timer button for the identified issue into a Web page.
     */
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        issueElement.appendChild(linkElement);
        // const trackBtn = $$('.content-panel-simple-action', issueElement);
        //
        // if (trackBtn) {
        //     linkElement.classList.add('timer-link-niftypm');
        //     trackBtn.before(linkElement);
        // }
    }
}

IntegrationService.register(new NiftyPM());