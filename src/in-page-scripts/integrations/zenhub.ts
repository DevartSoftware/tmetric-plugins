class ZenHub implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = 'https://app.zenhub.com/workspaces/*/issues/*';

    issueElementSelector = ['.zhc-issue-modal', '.zh-workspace__container'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let actions = $$('.zhc-issue-meta__actions', issueElement);
        if (actions) {
            linkElement.classList.add('devart-timer-link-zenhub', 'zhc-btn', 'zhc-btn--secondary');
            actions.firstChild.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName: string;
        let issueId: string;

        let issueTitle = $$.try('.zhc-issue-description__title', issueElement).textContent;
        if (issueTitle) {
            let splittedTitle = issueTitle.split('#');
            issueName = splittedTitle[0];
            issueId = splittedTitle.length > 1 && splittedTitle[1];
        }

        let projectName = $$.try('.zhc-breadcrumbs__button__name', issueElement).textContent;
        let issueUrl = source.path;
        let serviceUrl = source.protocol + source.host;

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'ZenHub' }
    }
}

IntegrationService.register(new ZenHub());