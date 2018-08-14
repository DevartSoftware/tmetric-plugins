class GoogleMail implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://mail.google.com/mail/*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let taskHeader = $$('.iH.bzn .G-tF');
        if (taskHeader) {
            let container = $$.create('div', 'G-Ni', 'J-J5-Ji');
            linkElement.classList.add('devart-timer-link-google-mail');
            container.appendChild(linkElement);
            taskHeader.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.ha h2').textContent;
        if (!issueName) {
            return;
        }

        let projectName = $$.try('.ha:last-of-type .hN').textContent;

        return { issueName, projectName };
    }
}

IntegrationService.register(new GoogleMail());