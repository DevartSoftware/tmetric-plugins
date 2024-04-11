class ZenHub implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://app.zenhub.com/workspaces/*/issues/*';

    issueElementSelector = ['.zhc-issue-modal', '.zh-workspace__container'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let actions = $$('.zhc-issue-meta__actions', issueElement);
        if (actions) {
            linkElement.classList.add('devart-timer-link-zenhub', 'zhc-btn', 'zhc-btn--secondary');
            actions.firstChild?.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueName: string | undefined;
        let issueId: string | undefined;

        let issueTitle = $$.try('.zhc-issue-description__title', issueElement).textContent;
        if (issueTitle) {
            let splittedTitle = issueTitle.split('#');
            issueName = splittedTitle[0];
            issueId = splittedTitle.length > 1 ? splittedTitle[1] : undefined;
        }

        const projectName = $$.try('.zhc-breadcrumbs__button__name', issueElement).textContent;
        const issueUrl = source.path;
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'ZenHub';

        return {
            issueId, issueName, issueUrl, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new ZenHub());