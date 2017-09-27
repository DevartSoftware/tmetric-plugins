module Integrations {

    class GoogleMail implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://mail.google.com/mail/*';

        observeMutations = true;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let taskHeader = $$('.ha');
            if (taskHeader) {
                linkElement.classList.add('devart-timer-link-gmail');
                taskHeader.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.ha h2').textContent;
            if (!issueName) {
                return;
            }

            let projectName = $$.try('.ha .hN').textContent;

            let issueUrl: string;
            let issueId: string;

            var serviceUrl = source.protocol + source.host;

            return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'GoogleMail', projectName };
        }
    }

    IntegrationService.register(new GoogleMail());
}