module Integrations {

    class GitHub implements WebToolIntegration {

        observeMutations = true;

        matchUrl = [
            '*://github.com/*'
        ];

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.gh-header-actions');
            if (host) {
                linkElement.classList.add('github');
                linkElement.classList.add('btn');
                linkElement.classList.add('btn-sm');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // https://github.com/NAMESPACE/PROJECT/issues/NUMBER
            // https://github.com/NAMESPACE/PROJECT/pull/NUMBER
            var match = /^(.+)\/(issues|pull)\/(\d+)$/.exec(source.path);

            if (!match) {
                return;
            }

            // match[3] is a 'NUMBER' from path
            var issueId = match[3];
            if (!issueId) {
                return;
            }

            var issueType = match[2];
            issueId = (issueType == 'pull' ? '!' : '#') + issueId

            // <h2 class="issue-title">IssueName</h2>
            var issueName = $$.try('.js-issue-title').textContent;
            if (!issueName) {
                return;
            }

            // <h1 class="title">
            //      <span>
            //          <a href="/(u|groups)/NAMESPACE">NameSpace</a> /
            //          <a href="/NAMESPACE/PROJECT">ProjectName</a> ·
            //          <a href="/NAMESPACE/PROJECT/(issues|pull)">(Issues|Merge Requests)</a>
            //      </span>
            //  </h1>
            var projectName = $$.try('.entry-title > strong > a').textContent;

            var serviceType = 'GitHub';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = source.path;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new GitHub());
}