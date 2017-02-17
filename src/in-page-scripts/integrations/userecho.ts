module Integrations {

    class Userecho implements WebToolIntegration {

        matchUrl = ['*://*.userecho.com/topics/*'];

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            var host = $$('.topic-actions-panel');

            if (host) {
                var container = $$.create('li');
                container.appendChild(linkElement);
                host.insertBefore(container, host.firstChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issue = $$.try('.topic-header a');
            
            if (!issue) {
                return;
            }

            let issueName = issue.textContent;
            let issueHref = issue.getAttribute('href');

            //https://company.userecho.com/topics/1-test/
            //https://company.userecho.com/topics/2-test-1-2/
            
            var match = /\/topics\/([\d])\-.*\//.exec(issueHref);
            if (!match) {
                return;
            }

            var issueId = match[1];
            var serviceUrl = source.protocol + source.host;
            // Work URL https://company.userecho.com/topics/2
            var issueUrl = '/topics/' + issueId;
            var projectName = $$.try('.navbar-brand').textContent;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Userecho' };
        }
    }

    IntegrationService.register(new Userecho());
}


