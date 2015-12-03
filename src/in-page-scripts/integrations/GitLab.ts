module Integrations {

    class GitLab implements WebToolIntegration {

        matchUrl = [
            '*://*/issues/*',
            '*://*/merge_requests/*'
        ];

        match(source: Source): boolean {
            var descriptionMeta = $$('meta[name=description]');
            if (descriptionMeta) {
                return descriptionMeta.getAttribute('content').indexOf('GitLab') >= 0;
            }
            return false;
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.page-title .pull-right') || $$('.page-title');
            if (host) {
                linkElement.classList.add('gitlab');
                linkElement.classList.add('btn');
                linkElement.classList.add('btn-grouped');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            // https://gitlab.com/NAMESPACE/PROJECT/issues/NUMBER
            // https://gitlab.com/NAMESPACE/PROJECT/merge_requests/NUMBER

            var match = /^(.+)\/(issues|merge_requests)\/(\d+)$/.exec(source.path);

            var result;

            if (match) {
                var issueId, issueName, projectName, serviceType, serviceUrl, issueUrl;

                // match[3] is a 'NUMBER' from path
                issueId = match[3];
                if (!issueId) {
                    return;
                }

                var issueType = match[2];
                var issueIdPrefix = '';
                if (issueType == 'issues') {
                    issueIdPrefix = '#'
                } else if (issueType == 'merge_requests') {
                    issueIdPrefix = '!'
                }
                issueId = issueIdPrefix + issueId;

                // <h2 class="issue-title">IssueName</h2>
                issueName = $$('.issue-title', true).textContent;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                // <h1 class="title">
                //      <span>
                //          <a href="/(u|groups)/NAMESPACE">NameSpace</a> /
                //          <a href="/NAMESPACE/PROJECT">ProjectName</a> ·
                //          <a href="/NAMESPACE/PROJECT/(issues|merge_requests)">(Issues|Merge Requests)</a>
                //      </span>
                //  </h1>

                projectName = $$('.title a:nth-last-child(2)', true).textContent;

                serviceType = 'GitLab';

                // match[1] is a 'https://gitlab.com/NAMESPACE/PROJECT' from path
                // cut '/NAMESPACE/PROJECT' from path
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