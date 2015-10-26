/// <reference path="../../interfaces/integrations" />
/// <reference path="../IntegrationService" />
/// <reference path="../utils" />

module Integrations {
    class GitHub implements WebToolIntegration {

        matchUrl = [
            '*://*/issues/*',
            '*://*/pull/*'
        ];

        match(source: Source): boolean {
            var descriptionMeta = $$('meta[name=description]');
            if (descriptionMeta) {
                return descriptionMeta.getAttribute('content').indexOf('GitHub') >= 0;
            }
            return false;
        }

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
                } else if (issueType == 'pull') {
                    issueIdPrefix = '!'
                }
                issueId = issueIdPrefix + issueId;

                // <h2 class="issue-title">IssueName</h2>
                issueName = $$('.js-issue-title', true).textContent;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                // <h1 class="title">
                //      <span>
                //          <a href="/(u|groups)/NAMESPACE">NameSpace</a> /
                //          <a href="/NAMESPACE/PROJECT">ProjectName</a> ·
                //          <a href="/NAMESPACE/PROJECT/(issues|pull)">(Issues|Merge Requests)</a>
                //      </span>
                //  </h1>

                projectName = $$('.entry-title > strong > a', true).textContent;

                serviceType = 'GitHub';

                // match[1] is a 'https://github.com/NAMESPACE/PROJECT' from path
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

    IntegrationService.register(new GitHub());
}