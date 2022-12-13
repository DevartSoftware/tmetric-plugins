class GoogleMail implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://mail.google.com/mail/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let taskHeader = $$('.ha');
        if (taskHeader) {
            linkElement.classList.add('devart-timer-link-google-mail');
            taskHeader.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.ha h2').textContent;
        if (!issueName) {
            return;
        }

        let projectName = $$.try('.ha:last-of-type .hN').textContent;
        let serviceUrl = source.protocol + source.host;
        return { issueName, projectName, serviceUrl, serviceType: 'Gmail' };
    }
}

IntegrationService.register(new GoogleMail());