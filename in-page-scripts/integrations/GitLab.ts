/// <reference path="../../interfaces/integrations" />
/// <reference path="../IntegrationService" />
/// <reference path="../utils" />

module Integrations {
    class GitLab implements WebToolIntegration {

        match(source: Source): boolean {
            var descriptionMeta = $$('meta[name=description]');
            if (descriptionMeta) {
                return descriptionMeta.getAttribute('content') == 'GitLab Enterprise Edition';
            }
            return false;
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var issueHost = $$('.issue .issue-details .page-title .pull-right');
            var mergeRequestHost = $$('.merge-request .merge-request-details .page-title .pull-right');
            var host = issueHost || mergeRequestHost;
            if (host) {
                linkElement.classList.add('gitlab');
                linkElement.classList.add('btn');
                linkElement.classList.add('btn-grouped');
                linkElement.innerHTML = '<i class="fa"></i>\n' + linkElement.innerHTML;
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // https://gitlab.com/USER/PROJECT/issues/NUMBER
            // https://gitlab.com/USER/PROJECT/merge_requests/NUMBER

            var issuesMatch = /^(.+)\/issues\/(\d+)$/.exec(source.path);
            var mergeRequestsMatch = /^(.+)\/merge_requests\/(\d+)$/.exec(source.path);
            var match;

            var isIssuesPath = issuesMatch !== null;
            var isMergeRequestsPath = mergeRequestsMatch !== null;
            
            var result;

            if (isIssuesPath || isMergeRequestsPath) {

                var issueId, issueName, projectName, serviceType, serviceUrl, issueUrl;
                
                if (isIssuesPath) {
                    
                    match = issuesMatch;
                    
                    // <h2 class="issue-title">IssueName</h2>
                    issueName = $$('.content .issue-details .issue-title', true).textContent;

                } else if (isMergeRequestsPath) {
                    
                    match = mergeRequestsMatch;
                    
                    // <h2 class="issue-title">IssueName</h2>
                    issueName = $$('.content .merge-request-details .issue-title', true).textContent;
                    
                }

                // match[2] is a 'NUMBER' from path
                issueId = match[2];

                if (!issueId || !issueName) {
                    return;
                }

                issueId = '#' + issueId;

                issueName = issueName.trim();

                // <h1 class="title">
                //      <span>
                //          <a href="/u/USER">UserName</a> /
                //          <a href="/USER/PROJECT">ProjectName</a> ·
                //          <a href="/USER/PROJECT/issues">Issues</a>
                //      </span>
                //  </h1>
                //
                // or
                //
                // <h1 class="title">
                //      <span>
                //          <a href="/u/USER">USER</a> /
                //          <a href="/USER/PROJECT">PROJECT</a> ·
                //          <a href="/USER/PROJECT/merge_requests">Merge Requests</a>
                //      </span>
                //  </h1>

                projectName = $$('header .header-content .title a:nth-child(2)', true).textContent;
                projectName = projectName.trim();

                serviceType = 'GitLab';

                // match[1] is a 'https://gitlab.com/USER/PROJECT' from path
                // cut '/USER/PROJECT' from path
                var servicePath = match[1].split('/').slice(0, -2).join('/');
                servicePath = (servicePath) ? '/' + servicePath : '';

                serviceUrl = source.protocol + source.host + servicePath;

                issueUrl = source.path.replace(serviceUrl, '');

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };

            }

            return result;
        }
    }

    IntegrationService.register(new GitLab());
}