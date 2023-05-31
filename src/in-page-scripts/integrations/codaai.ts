class CodaAi implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://coda.io/*';

    issueElementSelector = ['.L05kjtLQ','.ezCf9khc'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const element = $$('.hWu1bALp', issueElement) || $$('.UigI0tfj', issueElement);

        if (element) {
            linkElement.classList.add('devart-timer-link-codaai');
            element.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueId, issueName, issueUrl: string;

        const titleEl = $$('.fJ4CrlmG .LavvCQwF.H7Rn7XsB') || $$('.OvVV5z_O.MKgKd5Kj') || $$('.Fr99LwNL.MKgKd5Kj');
        if (titleEl) {
            issueName = titleEl.textContent;
        }

        issueUrl = source.path;
        const serviceUrl = source.protocol + source.host

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'Codaai' }
    }
}

IntegrationService.register(new CodaAi());