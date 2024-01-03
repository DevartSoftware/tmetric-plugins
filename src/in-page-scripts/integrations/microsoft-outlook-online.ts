class MicrosofOutlookOnline implements WebToolIntegration {

    showIssueId = false;

    matchUrl = [
        'https://outlook.live.com',
        'https://outlook.office.com',
        'https://outlook.office365.com'
    ];

    issueElementSelector = '#app';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const container = $$('.ms-CommandBar-primaryCommand', issueElement);
        if (container) {
            linkElement.classList.add('devart-timer-link-microsoft-outlook-live');
            container.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        // mail subject in default mode
        let issueName = $$.try('[role=main] .allowTextSelection[role=heading]', issueElement).textContent;

        if (!issueName) {
            // mail subject in expanded mode
            const issueNameInput = <HTMLInputElement>$$('.ms-TextField-field', issueElement);
            issueName = issueNameInput && issueNameInput.value;
        }

        if (!issueName) {
            return;
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'MicrosoftOutlookOnline';

        return {
            issueName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new MicrosofOutlookOnline());