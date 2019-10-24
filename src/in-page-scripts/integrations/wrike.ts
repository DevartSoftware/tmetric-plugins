class Wrike implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://*.wrike.com/workspace.htm*';

    issueElementSelector = '.wspace-task-view';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('.wrike-panel-header-toolbar', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-wrike');
            host.insertBefore(linkElement, host.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try<HTMLTextAreaElement>('textarea.title-field', issueElement).value;
        if (!issueName) {
            return;
        }

        let isModal = !!$$.closest('.x-plain', issueElement);

        let params = $$.searchParams(document.location.hash);
        let issueId = params['t']                 // folder, My Work,
            || params['ot']                       // modal
            // modals in Inbox did not translate issue id to url hash
            || (isModal ? null : params['ei']);   // Inbox

        let issueUrl: string;
        if (issueId) {
            issueUrl = '/open.htm?id=' + issueId;
            issueId = '#' + issueId;
        }

        let issueTags = $$.all('.wspace-task-widgets-tags-dataview > div', issueElement);
        let projectName: string;
        if (issueTags.length == 1) {
            projectName = issueTags[0].textContent;
        }

        let serviceType = 'Wrike';

        let serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Wrike());