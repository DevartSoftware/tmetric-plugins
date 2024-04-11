class GoogleMail implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://mail.google.com/mail/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const taskHeader = $$('.ha');
        if (taskHeader) {
            linkElement.classList.add('devart-timer-link-google-mail');
            taskHeader.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const issueName = $$.try('.ha h2').textContent;
        if (!issueName) {
            return;
        }

        const projectName = $$.try('.ha:last-of-type .hN').textContent;
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Gmail';
        return {
            issueName, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new GoogleMail());