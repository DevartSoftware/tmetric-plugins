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

            let issueUrl: string;
            let issueId: string;

            let matches = source.fullUrl.match(/\/mail\/.*#inbox\/([a-zA-Z0-9]+)/);
            if (matches) {
                issueUrl = matches[0];
                issueId = matches[1];
            }

            var serviceUrl = source.protocol + source.host;

            return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'GoogleMail' };
        }
    }

    IntegrationService.register(new GoogleMail());
}