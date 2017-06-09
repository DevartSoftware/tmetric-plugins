module Integrations {

    class Redmine implements WebToolIntegration {

        showIssueId = true;

        matchUrl = '*://*/issues/*';

        issueElementSelector = 'body.controller-issues.action-show';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('#content .contextual');
            if (host) {
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            const issuesPath = '/issues/';

            // http://rm.devart.local/redmine/issues/58480
            // PROTOCOL = http://
            // HOST = rm.devart.local
            // PATH = /redmine/issues/58480
            var i = source.path.lastIndexOf(issuesPath);
            var path = source.path.substr(0, i); // /redmine
            var serviceUrl = source.protocol + source.host + path; // http://rm.devart.local/redmine

            // path = /redmine/issues/58480
            var issueIdMatch = /\d+/.exec(source.path.substring(i + issuesPath.length));
            if (!issueIdMatch) {
                return;
            }
            var issueId = issueIdMatch[0];
            var issueUrl = issuesPath + issueId;
            issueId = '#' + issueId;

            // <div class="subject" >
            // <div><h3>The title of the issue</h3></div>
            var issueName = $$.try('.subject h3').textContent;
            if (!issueName) {
                return;
            }

            // <h1><a class="root" href="PATH/projects/almteam?jump=issues">ALM</a> » Time Tracker</h1>
            var projectName = $$.try('h1').textContent;
            if (projectName) {
                i = projectName.lastIndexOf('»');
                if (i >= 0) {
                    projectName = projectName.substring(i + 1);
                }
            }

            var serviceType = 'Redmine';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Redmine());
}