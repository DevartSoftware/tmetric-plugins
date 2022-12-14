class Insightly implements WebToolIntegration {

    showIssueId = false;

    matchUrl = [/https:\/\/crm\..*\.insightly\.com\/.*\?blade=\/details\/task\/.*/i, /https:\/\/crm\..*\.insightly\.com\/details\/task\/.*/i];

    issueElementSelector = () => [$$('#main-container.details') || $$('#main-container.details.details-single')];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let toolbar = $$('.btn-toolbar.custom-buttons-toolbar', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn');
            toolbar.firstChild.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('#metadata-row-viewer-TITLE', issueElement).title;
        let issueId = $$.try('#metadata-row-viewer-TASK_ID', issueElement).title;
        let issueUrl = issueId && `details/task/${issueId}`;
        let projectName = $$.try('#metadata-row-viewer-PROJECT_ID', issueElement).title ||
            $$.try('#metadata-row-viewer-OPPORTUNITY_ID', issueElement).title;
        let serviceUrl = source.protocol + source.host;

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Insightly' }
    }
}

IntegrationService.register(new Insightly());