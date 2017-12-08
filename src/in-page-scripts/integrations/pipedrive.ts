class Pipedrive implements WebToolIntegration {
    showIssueId: boolean;

    /**
     * The array of URLs (with wildcards) that are used to identify
     * pages as those that belong to the service.
     */
    matchUrl = [
        '*://*.pipedrive.com/deal/*'
    ];

    /**
     * observeMutations = true means that the extension observes the page for
     * dynamic data loading. This means that, if the tool loads some parts of
     * the page with AJAX or generates dynamically, the TMetric extension waits
     * until all loading is done and then adds the button to the page.
     */
    observeMutations = true;

    /**
     * Extracts information about the issue (ticket or task) from a Web
     * page by querying the DOM model.
     */
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        var issueId = source.path;
        var issueName = document.title;
        var serviceUrl = source.protocol + source.host;
        var issueUrl = source.path;
        var projectName = 'sales';

        return {
            issueId,
            issueName,
            issueUrl,
            projectName,
            serviceUrl,
            serviceType: 'Pipedrive'
        };
    }

    /**
     * Inserts the timer button for the identified issue into a Web page.
     */
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.mainmenu');
        if (host) {
            var container = $$.create('li');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }
}

IntegrationService.register(new Pipedrive());