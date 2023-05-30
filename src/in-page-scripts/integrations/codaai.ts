class CodaAi implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://coda.io/*';

    issueElementSelector = ['.c9jZ0h9a','.hWu1bALp'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        issueElement.classList.add('devart-timer-link-codaai');
        issueElement.insertBefore(linkElement, issueElement.firstElementChild);
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