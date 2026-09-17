class MicrosofOutlookOnline implements WebToolIntegration {

    showIssueId = false;

    matchUrl = [
        'https://outlook.live.com',
        'https://outlook.office.com',
        'https://outlook.office365.com',
        'https://outlook.cloud.microsoft'
    ];

    // "Open in new window" popout does not have the "#app" shell that wraps the main 3-pane view
    issueElementSelector = () => [$$('#app') || document.body];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('devart-timer-link-microsoft-outlook-live');

        const classicContainer = $$('.ms-CommandBar-primaryCommand', issueElement);
        if (classicContainer) {
            classicContainer.appendChild(linkElement);
            return;
        }

        const layoutToggle = $$('#RibbonModeToggle', issueElement);
        const chevronContainer = layoutToggle && layoutToggle.parentElement;
        if (chevronContainer && chevronContainer.parentElement) {
            chevronContainer.parentElement.insertBefore(linkElement, chevronContainer);
            return;
        }

        const fallbackContainer = $$('#paddleContainer [id$="-panel"]', issueElement);
        if (fallbackContainer) {
            fallbackContainer.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        // mail subject in default mode (classic Outlook) or new Outlook (Monarch UI on outlook.cloud.microsoft);
        // the "Open in new window" popout has no [role=main] ancestor, so also match by the reading pane container id
        let issueName = $$.try(
            '[role=main] .allowTextSelection[role=heading], ' +
            '[role=main] [role=heading][id$="_SUBJECT"], ' +
            '#ItemReadingPaneContainer [role=heading][id$="_SUBJECT"]',
            issueElement).textContent;

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