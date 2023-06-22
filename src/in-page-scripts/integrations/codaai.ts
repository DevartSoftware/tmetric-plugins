class CodaAi implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://coda.io/*';

    issueElementSelector = ['header'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const element = issueElement.querySelector('[data-coda-ui-id="sharing-button"]');
        if (element) {
            linkElement.classList.add('devart-timer-link-codaai');
            element.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueId, issueName, issueUrl: string;
        let data = document.title.split(/ \| |\u00B7/);
        issueName = data[data.length - 1];
        issueUrl = source.path;
        issueId = source.path;
        const serviceUrl = source.protocol + source.host

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'CodaAI' }
    }
}

IntegrationService.register(new CodaAi());