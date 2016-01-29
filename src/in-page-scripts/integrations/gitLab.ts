module Integrations {

    class GitLab implements WebToolIntegration {

        matchUrl = [
            '*://*/issues/*',
            '*://*/merge_requests/*'
        ];

        match(source: Source): boolean {
            return !!$$('.gitlab-text-container');
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.detail-page-header .pull-right');
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

            if (!match) {
                return;
            }

            // match[3] is a 'NUMBER' from path
            var issueId = match[3];
            if (!issueId) {
                return;
            }

            var issueType = match[2];
            issueId = (issueType == 'merge_requests' ? '!' : '#') + issueId;

            // <div class="detail-page-description gray-content-block second-block">
            //      <h2 class="title">IssueName</h2>
            // </div>
            var issueName = $$.try('.detail-page-description .title').textContent;
            if (!issueName) {
                return;
            }

            // <h1 class="title">
            //      <span>
            //          <a href="/(u|groups)/NAMESPACE">NameSpace</a> /
            //          <a href="/NAMESPACE/PROJECT">ProjectName</a> ·
            //          <a href="/NAMESPACE/PROJECT/(issues|merge_requests)">(Issues|Merge Requests)</a>
            //      </span>
            //  </h1>
            var projectName = $$.try('.title a:nth-last-child(2)').textContent;

            var serviceType = 'GitLab';

            // match[1] is a 'https://gitlab.com/NAMESPACE/PROJECT' from path
            // cut '/NAMESPACE/PROJECT' from path
            var servicePath = match[1].split('/').slice(0, -2).join('/');
            servicePath = (servicePath) ? '/' + servicePath : '';

            var serviceUrl = source.protocol + source.host + servicePath;

            var issueUrl = source.path.replace(serviceUrl, '');

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new GitLab());
}