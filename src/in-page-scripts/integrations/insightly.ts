class Insightly implements WebToolIntegration {

    showIssueId = false;

    matchUrl = [/https:\/\/crm\..*\.insightly\.com\/.*\?blade=\/details\/task\/.*/i, /https:\/\/crm\..*\.insightly\.com\/details\/task\/.*/i];

    issueElementSelector = () => [$$('#main-container.details') || $$('#main-container.details.details-single')];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const toolbar = $$('.btn-toolbar.custom-buttons-toolbar', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn');
            toolbar.prepend(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const issueName = $$.try('#metadata-row-viewer-TITLE', issueElement).title;
        const issueId = $$.try('#metadata-row-viewer-TASK_ID', issueElement).title;
        const issueUrl = issueId && `details/task/${issueId}`;
        const projectName = $$.try('#metadata-row-viewer-PROJECT_ID', issueElement).title ||
            $$.try('#metadata-row-viewer-OPPORTUNITY_ID', issueElement).title;
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Insightly';

        return {
            issueId, issueName, issueUrl, projectName, serviceUrl, serviceType
        } as WebToolIssue
    }
}

IntegrationService.register(new Insightly());