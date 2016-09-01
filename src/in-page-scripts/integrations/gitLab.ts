module Integrations {

    class GitLab implements WebToolIntegration {

        matchUrl = [
            '*://*/issues/*',
            '*://*/merge_requests/*'
        ];

        match(source: Source): boolean {
            return !!$$('.detail-page-description .title');
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var header = $$('.detail-page-header');
            if (header) {
                var buttons = $$('.issue-btn-group', header);
                if (buttons) {
                    linkElement.classList.add('btn', 'btn-grouped');
                    buttons.appendChild(linkElement);
                } else {
                    linkElement.classList.add('btn', 'devart-timer-link-margin-left');
                    header.appendChild(linkElement);
                }
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

            var issueNameElement = $$.try('.detail-page-description .title');
            var issueName = issueNameElement.firstChild ? issueNameElement.firstChild.textContent : issueNameElement.textContent;
            if (!issueName) {
                return;
            }

            var projectNameElement = $$.try('.title .project-item-select-holder').firstChild;
            var projectName = projectNameElement ?
                projectNameElement.textContent : // current design
                $$.try('.title > span > a:nth-last-child(2)').textContent; // old design

            var serviceType = 'GitLab';

            // match[1] is a 'https://gitlab.com/NAMESPACE/PROJECT' from path
            // cut '/NAMESPACE/PROJECT' from path
            var servicePath = match[1].split('/').slice(0, -2).join('/');
            servicePath = (servicePath) ? '/' + servicePath : '';

            var serviceUrl = source.protocol + source.host + servicePath;

            var issueUrl = $$.getRelativeUrl(serviceUrl, source.path);

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new GitLab());
}