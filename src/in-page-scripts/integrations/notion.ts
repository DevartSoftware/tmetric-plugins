class Notion implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://www.notion.so/*';

    issueElementSelector = ['.notion-peek-renderer', '.notion-cursor-listener > div[class=""]'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        const shareBtn = $$('.notion-topbar-share-menu', issueElement);

        if (shareBtn) {
            linkElement.classList.add('devart-timer-link-notion');
            shareBtn.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueId: string | null | undefined;
        let issueName: string | null | undefined;
        let issueUrl: string | null | undefined;

        const titleEl = $$('.notion-page-block > h1.notranslate', issueElement);
        if (titleEl) {
            issueName = titleEl.textContent || titleEl.getAttribute('placeholder');
            const idAttr = titleEl.parentElement?.getAttribute('data-block-id');
            issueId = idAttr && idAttr.replace(/-/g, '');
            issueUrl = issueId;
        }

        const serviceUrl = source.protocol + source.host
        const serviceType = 'Notion';

        return {
            issueId, issueName, issueUrl, serviceUrl, serviceType
        } as WebToolIssue
    }
}

IntegrationService.register(new Notion());