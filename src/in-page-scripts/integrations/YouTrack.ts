module Integrations {

    class YouTrack implements WebToolIntegration {

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

            // charisma.ComboBoxHelper.create(
            //   byid(id)
            //   "P1",
            //   { "multi": false, "values": [{ "text": "Project 1", "id": "P1", "styleClass": "" }] });
            var newIssueScript = $$.try('#newIssueDialog script').textContent;
            var projectsMatch = /ComboBoxHelper.*"values":\s*(\[.*\])/.exec(newIssueScript);
            if (projectsMatch) {
                let projects: { text: string, id: string }[];
                let projectsJSON = projectsMatch[1].replace(/\\\'/g, '\'');
                try {
                    projects = JSON.parse(projectsJSON);
                }
                catch (e) {
                }
                if (projects) {
                    let projectId = issueId.split('-')[0];
                    let project = projects.filter(project => project.id === projectId)[0];
                    if (project) {
                        var projectName = project.text;
                    }
                }
            }

            var serviceType = 'YouTrack';

            var serviceUrl = match[1];

            var issueUrl = 'issue/' + issueId;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new YouTrack(), new YouTrackBoard());
}