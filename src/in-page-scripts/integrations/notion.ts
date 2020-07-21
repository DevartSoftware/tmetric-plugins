class Notion implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = 'https://www.notion.so/*';

    issueElementSelector = ['.notion-frame', '.notion-default-overlay-container'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let shareBtn = $$('.notion-topbar-share-menu', issueElement);

        if (shareBtn) {
            linkElement.classList.add('devart-timer-link-notion');
            shareBtn.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueId, issueName, issueUrl: string;

        let titleEl = $$('.notion-page-block > div[data-root=true]', issueElement);
        if (titleEl) {
            issueName = titleEl.textContent || 'Untitled';
            let idAttr = titleEl.parentElement.getAttribute('data-block-id');
            issueId = idAttr && idAttr.replace(/-/g, '');
            issueUrl = issueId;
        }

        let serviceUrl = source.protocol + source.host

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'Notion' }
    }
}

IntegrationService.register(new Notion());