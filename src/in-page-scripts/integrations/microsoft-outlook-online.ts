class MicrosofOutlookOnline implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://outlook.live.com';

    observeMutations = true;

    issueElementSelector = '#app';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let container = $$('.ms-CommandBar-primaryCommand', issueElement);
        if (container) {
            linkElement.classList.add('devart-timer-link-microsoft-outlook-live');
            container.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // mail subject in default mode
        let issueName = $$.try('[role=main] .allowTextSelection[role=heading]', issueElement).textContent;

        if (!issueName) {
            // mail subject in expanded mode
            let issueNameInput = <HTMLInputElement>$$('.ms-TextField-field', issueElement);
            issueName = issueNameInput && issueNameInput.value;
        }

        if (!issueName) {
            return;
        }

        let serviceUrl = source.protocol + source.host;

        return { issueName, serviceUrl, serviceType: 'MicrosoftOutlookOnline' };
    }
}

IntegrationService.register(new MicrosofOutlookOnline());