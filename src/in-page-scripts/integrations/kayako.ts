class Kayako implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://*/agent/conversations/*';

    issueElementSelector = '.ko-case-content';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const container = issueElement.querySelector('[class^="ko-tabs__tabs_"] [class^="ko-tabs__right_"]');
        if (!container) {
            return;
        }

        const existing = container.querySelector('.devart-timer-link');
        if (existing) {
            return;
        }

        container.appendChild(linkElement);
    }

    getIssue(issueElement: HTMLElement, source: Source) {
        return {
            issueId: this.getIssueId(issueElement),
            issueName: this.getIssueName(issueElement),
            serviceType: 'Kayako',
            serviceUrl: source.protocol + source.host,
            issueUrl: source.path,
        } as WebToolIssue;
    }

    getIssueId(issueElement: HTMLElement) {
        return issueElement
            .querySelector(' [class^="ko-tabs__tabs_"] div[class^="ko-case-content__id"]')
            ?.textContent
            ?.replace(/^[\W#]+/, '');
    }

    getIssueName(issueElement: HTMLElement) {
        return issueElement
            .querySelector('[class^="ko-tabs_case__subject_"]')
            ?.textContent
            ?.trim();
    }
}

IntegrationService.register(new Kayako());
