class CodaAi implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://coda.io/*';

    issueElementSelector = ['.L05kjtLQ', 'header'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let element;
        if (issueElement.matches(this.issueElementSelector[0])) {
            element = $$('.hWu1bALp', issueElement);
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            element = issueElement.children[1].children[1].children[1];// $$('.hWu1bALp', issueElement) || $$('.QqQVOk8D', issueElement);
        }

        if (element) {
            linkElement.classList.add('devart-timer-link-codaai');
            element.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueId, issueName, issueUrl, projectName: string;
        let data = document.title.split(/ \| |\u00B7/);
        issueName = data[1];
        projectName = data[0];
        issueUrl = source.path;
        issueId = source.path;
        const serviceUrl = source.protocol + source.host

        return { issueId, issueName, projectName, issueUrl, serviceUrl, serviceType: 'CodaAI' }
    }
}

IntegrationService.register(new CodaAi());