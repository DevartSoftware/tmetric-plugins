class Salesforce implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    // https://eu16.lightning.force.com/lightning/r/PAGE/IDENTIFIER/view
    matchUrl = '*://*.lightning.force.com';

    issueElementSelector = [
        '.slds-page-header' // page header
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('.forceActionsContainer', issueElement);
        if (host) {
            linkElement.style.marginRight = '0.5rem';
            linkElement.style.alignSelf = 'center';
            host.parentNode.insertBefore(linkElement, host);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let serviceType = 'Salesforce';

        let serviceUrl = source.protocol + source.host;

        let issueName: string;
        let issueId: string;
        let issueUrl: string;

        let title = $$.visible('h1 .slds-page-header__title, h1 .uiOutputText', issueElement);
        if (!title) {
            return;
        }

        issueName = title.textContent;
        if (!issueName) {
            return;
        }

        let match = /\/lightning\/r\/(\w+)\/(\w+)\/view$/.exec(source.path);
        if (match) {
            issueId = match[2];
        } else if (/\/lightning\/o\/Task\/home$/.test(source.path)) {
            let recentTask = $$.all('.forceListViewManagerSplitViewList .slds-split-view__list-item-action').find(el => {
                let textEl = $$.visible('.uiOutputText', el);
                if (textEl) {
                    return textEl.textContent == title.textContent;
                }
            });
            if (recentTask) {
                issueId = recentTask.getAttribute('data-recordid');
            }
        }

        if (issueId) {
            issueUrl = `/lightning/r/${issueId}/view`;
        }

        return { serviceType, serviceUrl, issueName, issueId, issueUrl };
    }
}

IntegrationService.register(new Salesforce());