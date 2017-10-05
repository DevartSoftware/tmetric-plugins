module Integrations {

    class GoogleKeep implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://keep.google.com/#*';

        issueElementSelector = [
            '.VIpgJd-TUo6Hb.XKSfm-L9AdLc.eo9XGd .CmABtb.RNfche', // selector for row with checkbox (in the checklist)
            '.VIpgJd-TUo6Hb.XKSfm-L9AdLc.eo9XGd .IZ65Hb-yePe5c'  // selector for toolbar
        ];

        observeMutations = true;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            linkElement.classList.add('devart-timer-link-minimal');

            if (issueElement.matches(this.issueElementSelector[0])) {
                linkElement.classList.add('devart-timer-link-google-keep-minimal')
                issueElement.insertBefore(linkElement, issueElement.querySelector('div[role="button"]:last-child'));
            } else if (issueElement.matches(this.issueElementSelector[1])) {
                linkElement.classList.add('devart-timer-link-google-keep-toolbar')
                let toolbar = issueElement.querySelector('[role="toolbar"]');
                toolbar.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName: string;
            let issueUrl: string;
            let issueId: string;
            let serviceUrl: string;

            if (issueElement.matches(this.issueElementSelector[0])) {
                issueName = $$.try('.IZ65Hb-YPqjbf.CmABtb-YPqjbf.notranslate', issueElement).textContent;
            } else if (issueElement.matches(this.issueElementSelector[1])) {
                let card = $$.closest('.VIpgJd-TUo6Hb.XKSfm-L9AdLc.eo9XGd', issueElement);
                if (card) {
                    issueName = $$('.notranslate.IZ65Hb-YPqjbf.r4nke-YPqjbf', card).textContent;
                }

                let matches = source.fullUrl.match(/\/#[a-zA-Z]+\/(\d+\.\d+).*/);
                if (matches) {
                    issueUrl = matches[0];
                    issueId = matches[1];
                    serviceUrl = source.protocol + source.host;
                }
            }

            if (!issueName) {
                return;
            }

            if (issueUrl) {
                return { issueUrl, issueId, issueName, serviceUrl, serviceType: 'GoogleKeep' };
            } else {
                return { issueName };
            }
        }
    }

    IntegrationService.register(new GoogleKeep());
}