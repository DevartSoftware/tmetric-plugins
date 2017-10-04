class YouTrack implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/issue/*';

    issueElementSelector = '.content_fsi .toolbar_fsi';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        issueElement.appendChild(linkElement);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Full url:
        // https://HOST/PATH/issue/ISSUE_ID#PARAMETERS
        var match = /^(.+)\/issue\/(.+)$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        var issueId = $$.try('.issueId', issueElement).textContent;
        if (!issueId) {
            return;
        }

        var issueName = $$.try('.issue-summary', issueElement).textContent;
        if (!issueName) {
            return;
        }

        var projectName = $$.try('.fsi-properties .fsi-property .attribute.bold').textContent;

        var serviceType = 'YouTrack';

        var serviceUrl = match[1];

        var issueUrl = 'issue/' + issueId;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

class YouTrackBoard implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/agiles/*';

    issueElementSelector = '.yt-issue-view';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.yt-issue-view__toolbar', issueElement);
        if (host) {
            host.parentElement.insertBefore(linkElement, host.nextElementSibling);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Full url:
        // https://HOST/PATH/agiles/*/*
        var match = /^(.+)\/agiles\/.+$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        var issueId = $$.try('.yt-issue-view__issue-id', issueElement).textContent.trim();
        if (!issueId) {
            return;
        }

        var issueName = $$.try('.yt-issue-body__summary', issueElement).textContent;
        if (!issueName) {
            return;
        }

        var projectName = $$.try('.yt-issue-fields-panel__field-value', issueElement).textContent;

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

IntegrationService.register(new YouTrack(), new YouTrackBoard(), new YouTrackBoardOld());