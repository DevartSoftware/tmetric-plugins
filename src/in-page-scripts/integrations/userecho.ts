module Integrations {

    class Userecho implements WebToolIntegration {

        matchUrl = ['*://*.userecho.com/topics/*'];

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            var host = $$('.module-body .topic-actions-panel');

            if (host) {
                var container = $$.create('li');
                container.appendChild(linkElement);
                host.insertBefore(container, host.firstChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.module-body .topic-header a').textContent;
            if (!issueName) {
                return;
            }

            let issueHref = $$.try('.module-body .topic-header a').getAttribute('href');

            var match = /\/([\w-]+)\/([\w-]+)\//.exec(issueHref);
            if (!match) {
                return;
            }

            var issueId = match[2];
            var serviceUrl = source.protocol + source.host;
            var issueUrl = source.path;
            var projectName = $$.try('.navbar-brand').textContent;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Userecho' };
        }
    }

    IntegrationService.register(new Userecho());
}


