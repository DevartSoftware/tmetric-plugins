class YouTrack implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = ['*://*/issue/*', '*://*/agiles/*'];

    issueElementSelector = [
        '.content_fsi .toolbar_fsi', // old interface
        '.yt-issue-view'    // new interface
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-youtrack')

            var host = $$('.yt-issue-view__toolbar', issueElement);
            if (!!host) {
                host.parentElement.insertBefore(linkElement, host.nextElementSibling);
            }

            return;
        }

        issueElement.appendChild(linkElement);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Full url (task):
        // https://HOST/PATH/issue/ISSUE_ID#PARAMETERS
        // Full url (agile):
        // https://HOST/PATH/agiles/*/*
        var match = /^(.+)\/issue\/(.+)$/.exec(source.fullUrl) || /^(.+)\/agiles\/.+$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        var issueId = $$.try('.issueId', issueElement).textContent ||
            $$('.js-issue-id', issueElement.closest('.yt-issue-view')).textContent ||
            $$.try('.yt-issue-view__issue-id', issueElement).textContent.trim();

        if (!issueId) {
            return;
        }

        var issueName = $$.try('.issue-summary', issueElement).textContent ||
            $$.try('.yt-issue-body__summary', issueElement).textContent ||
            $$.try('.yt-issue-fields-panel__field-value', issueElement).textContent;

        if (!issueName) {
            return;
        }

        var projectName = $$.try('.fsi-properties .fsi-property .attribute.bold').textContent ||
            $$.try('.yt-issue-key-value-list').querySelector('tr td:nth-child(2)').textContent;

        var serviceType = 'YouTrack';

        var serviceUrl = match[1];

        var issueUrl = 'issue/' + issueId;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

class YouTrackBoardOld implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/rest/agile/*/sprint/*';

    issueElementSelector = '#editIssueDialog';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.sb-issue-edit-id', issueElement);
        if (host) {
            host.parentElement.insertBefore(linkElement, host.nextElementSibling);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Full url:
        // https://HOST/PATH/rest/agile/*/sprint/*
        var match = /^(.+)\/rest\/agile\/(.+)$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        var issueId = $$.try('.sb-issue-edit-id', issueElement).textContent;
        if (!issueId) {
            return;
        }

        var issueName =
            $$.try<HTMLInputElement>('.sb-issue-edit-summary input', issueElement).value || // logged in
            $$.try('.sb-issue-edit-summary.sb-disabled', issueElement).textContent; // not logged in
        if (!issueName) {
            return;
        }

        // project name can be resolved for logged in users only
        var projectSelector = $$('.sb-agile-dlg-projects');
        if (projectSelector) {
            var projectName = $$.try('label[for=editAgileProjects_' + issueId.split('-')[0] + ']', projectSelector).textContent;
        }

        var serviceType = 'YouTrack';

        var serviceUrl = match[1];

        var issueUrl = 'issue/' + issueId;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new YouTrack(), new YouTrackBoardOld());