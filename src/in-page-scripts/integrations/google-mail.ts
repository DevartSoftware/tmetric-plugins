class GoogleMail implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://mail.google.com/mail/*';

    observeMutations = true;

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

        return { issueName, serviceType: 'GoogleMail', projectName };
    }
}

IntegrationService.register(new GoogleMail());