class Dixa implements WebToolIntegration {

    showIssueId = true;

    /**
     * The array of URLs (with wildcards) that are used to identify
     * pages as those that belong to the service.
     */
    matchUrl = [
        '*://*.dixa.com/conversation/*'
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
        // eg. https://[subdomain].dixa.com/conversation/1
        const getTitle = () => {
            const title = $$.try('.conversation-view__main [class^=conversationHeader__] [class^=headline__] p').textContent;
            return title;
        };

        const getConversationId = () => {
            const csid = $$.try('.conversation-view__main button span').textContent;
            return csid;
        };

        const getProject = () => {
            const subdomain = source.host.replace(".dixa.com", "");
            return subdomain;
        };

        const issueId = getConversationId();
        const issueName = getTitle();
        const projectName = getProject();
        const serviceType = 'Dixa';
        const serviceUrl = source.protocol + source.host;
        const issueUrl = source.path;

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
    }

    /**
     * Inserts the timer button for the identified issue into a Web page.
     */
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$.visible('.conversation-view__main [class^=conversationHeader__] [class^=topActions__] [class^=root__]');
        if (host) {
            linkElement.classList.add('devart-timer-link-dixa');
            host.appendChild(linkElement);
        }
    }
}

IntegrationService.register(new Dixa());