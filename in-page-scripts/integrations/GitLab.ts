/// <reference path="../../interfaces/integrations" />
/// <reference path="../IntegrationService" />
/// <reference path="../utils" />

module Integrations {
    class GitLab implements WebToolIntegration {

        issuesPath = '/issues/';

        matchUrl = '*://*/issues/*';

        // matchSelector = 'body.controller-issues.action-show';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('#new_issue_link');
            if (host)
            {
                linkElement.classList.add('gitlab');
                linkElement.classList.add('btn');
                linkElement.classList.add('btn-grouped');
                linkElement.innerHTML = '<i class="fa"></i>\n' + linkElement.innerHTML;
                host.parentNode.insertBefore(linkElement, host);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var i: number;

            // https://gitlab.com/user/repo/issues/1
            // PROTOCOL = https://
            // HOST = gitlab.com
            // PATH = /user/repo/issues/1
            i = source.path.lastIndexOf(this.issuesPath);
            var path = source.path.substr(0, i); // user/repo
            var serviceUrl = source.protocol + source.host + path; // https://gitlab.com/user/repo

            var issueIdMatch = /\d+/.exec(source.path.substring(i + this.issuesPath.length));
            if (!issueIdMatch) {
                return;
            }
            var issueId = issueIdMatch[0];
            var issueUrl = '/issues/' + issueId;
            issueId = '#' + issueId;

            // <h2 class="issue-title">test-gitlab-issue</h2>
            var issueName = $$('.issue-details .issue-title', true).textContent;
            if (!issueName) {
                return;
            }

            // <h1 class="title">
            //      <span>
            //          <a href="/u/SergeyMul">SergeyMul</a> /
            //          <a href="/SergeyMul/test-gitlab">test-gitlab</a> ·
            //          <a href="/SergeyMul/test-gitlab/issues">Issues</a>
            //      </span>
            //  </h1>
            var projectName = $$('.header-content .title a:nth-child(2)', true).textContent;
            projectName = projectName.trim();

            var serviceType = 'GitLab';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new GitLab());
}