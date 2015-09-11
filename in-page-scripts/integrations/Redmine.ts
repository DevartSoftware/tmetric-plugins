/// <reference path="../../interfaces/integrations" />
/// <reference path="../IntegrationService" />
/// <reference path="../utils" />

module Integrations {
    class Redmine implements WebToolIntegration {
        issuesPath = '/issues/';

        matchUrl = '*://*/issues/*';

        matchSelector = 'body.controller-issues.action-show';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            linkElement.classList.add('icon');
            $$('#content .contextual').appendChild(linkElement);
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            var i: number;

            if (!$$('#content .contextual')) {
                return;
            }

            // http://rm.devart.local/redmine/issues/58480
            // PROTOCOL = http://
            // HOST = rm.devart.local
            // PATH = /redmine/issues/58480
            i = source.path.lastIndexOf(this.issuesPath);
            var path = source.path.substr(0, i); // /redmine
            var serviceUrl = source.protocol + source.host + path; // http://rm.devart.local/redmine

            // path = /redmine/issues/58480
            var issueIdMatch = /\d+/.exec(source.path.substring(i + this.issuesPath.length));
            if (!issueIdMatch) {
                return;
            }
            var issueId = issueIdMatch[0];
            var issueUrl = '/issues/' + issueId;
            issueId = '#' + issueId;

            // <div class="subject" >
            // <div><h3>The title of the issue</h3></div>
            var issueName = $$('.subject h3', true).textContent;
            if (!issueName) {
                return;
            }

            // <h1><a class="root" href="PATH/projects/almteam?jump=issues">ALM</a> » Time Tracker</h1>
            var projectName = $$('h1', true).textContent;
            if (projectName) {
                i = projectName.lastIndexOf('»');
                if (i >= 0) {
                    projectName = projectName.substring(i + 1);
                }
                projectName = projectName.trim();
            }

            var serviceType = 'Redmine';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Redmine());
}