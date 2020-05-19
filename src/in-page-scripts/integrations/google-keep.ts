class GoogleKeep implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://keep.google.com/*#*';

    issueElementSelector = [
        '.XKSfm-L9AdLc .CmABtb.RNfche', // selector for row with checkbox (in the checklist)
        '.XKSfm-L9AdLc .IZ65Hb-yePe5c'  // selector for toolbar
    ];

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('devart-timer-link-minimal');

        if (issueElement.matches(this.issueElementSelector[0])) { // for checklist
            linkElement.classList.add('devart-timer-link-google-keep-item');
            let btn = issueElement.querySelector('div[role="button"]:last-child');
            if (btn) {
                btn.parentElement.insertBefore(linkElement, btn);
            }
        } else if (issueElement.matches(this.issueElementSelector[1])) { // for note
            linkElement.classList.add('devart-timer-link-google-keep-note');
            let toolbar = issueElement.querySelector('[role="toolbar"]');
            toolbar.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName: string;
        let issueUrl: string;
        let issueId: string;
        let serviceUrl = source.protocol + source.host;

        if (issueElement.matches(this.issueElementSelector[0])) { // if checklist
            issueName = $$.try('.notranslate', issueElement).textContent;
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            let card = $$.closest('.XKSfm-L9AdLc', issueElement);
            if (card) {
                issueName = $$('.notranslate', card).textContent;
            }

            let matches = source.fullUrl.match(/\/#[a-zA-Z]+\/([\w\.-]+)$/);
            if (matches) {
                issueUrl = matches[0];
                issueId = matches[1];
            }
        }

        return { issueUrl, issueId, issueName, serviceUrl, serviceType: 'GoogleKeep' };
    }
}

IntegrationService.register(new GoogleKeep());