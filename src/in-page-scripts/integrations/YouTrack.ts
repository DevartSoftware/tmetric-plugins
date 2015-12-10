module Integrations {

    class YouTrack implements WebToolIntegration {

        matchUrl = '*://*/issue/*';

        issueElementSelector = '.content_fsi .toolbar_fsi';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            if (issueElement) {
                issueElement.appendChild(linkElement);
            }
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

            var projectName = $$.try('.fsi-properties .disabled.bold').textContent;

            var serviceType = 'YouTrack';

            var serviceUrl = match[1];

            //var issueUrl = 'issue/' + match[2].replace(/[\?\#].*$/, '');
            var issueUrl = 'issue/' + issueId;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    class YouTrackBoard implements WebToolIntegration {

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

            var projectId = issueId.split('-')[0];
            var text = $$.try('#newIssueDialog script').textContent;
            if (text) {
                try {
                    var projects = JSON.parse(/.*(\[.*\]).*/.exec(text)[1]);
                    var project = projects.filter((project) => { return project.id === projectId })[0];
                    var projectName = project.text;
                } catch (e) { };
            }

            var serviceType = 'YouTrack';

            var serviceUrl = match[1];

            var issueUrl = 'issue/' + issueId;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new YouTrack());
    IntegrationService.register(new YouTrackBoard());
}