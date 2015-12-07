module Integrations {

    class JiraBase {

        match(source: Source): boolean {
            var jiraAppQuery = $$('meta[name=application-name]');
            if (jiraAppQuery) {
                return jiraAppQuery.getAttribute('content') == 'JIRA';
            }

            return false;
        }

        getUrls(source: Source, issueHref: string) {

            var serviceUrl = source.protocol + source.host;
            var issueUrl = issueHref;

            // for case when jira installed outside domain root we should append context path to serviceUrl and remove it from issueUrl
            // https://issues.apache.org/jira/
            // ajs-context-path = /jira
            // serviceUrl = http://jira.local
            // issueUrl = /jira/browse/tt-1
            var jiraContextPath = $$('meta[name=ajs-context-path]').getAttribute('content');
            if (jiraContextPath) {
                serviceUrl += jiraContextPath;
                issueUrl = $$.getRelativeUrl(serviceUrl, issueUrl);
            }

            return { serviceUrl, issueUrl };
        }
    }

    class Jira extends JiraBase implements WebToolIntegration {

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.command-bar .toolbar-split');
            if (host) {
                linkElement.classList.add('toolbar-trigger');

                // <ul class="toolbar-group">
                var containerUl = $$.create('ul', 'toolbar-group');

                // <li class="toolbar-item">
                var containerLi = $$.create('li', 'toolbar-item');
                containerLi.appendChild(linkElement);

                containerUl.appendChild(containerLi);
                host.appendChild(containerUl);
            }
        }

        /* This code is suitable for both Jira and Jira Service Desk */
        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // https://devart.atlassian.net/browse/TT-1
            // PROTOCOL = http://
            // HOST = devart.atlassian.net
            // PATH = /browse/TT-1
            var issueName = $$.try('#summary-val').textContent;
            if (!issueName) {
                return;
            }

            var issueLink = $$('#key-val');
            if (issueLink) {
                var issueId = issueLink.getAttribute('data-issue-key');
                var issueHref = issueLink.getAttribute('href');
            }

            // First selector is for separate task view (/browse/... URL). The second selector is for Service Desk view.
            var projectName = $$.try('#project-name-val').textContent || $$.try('.project-title > a').textContent;

            var { serviceUrl, issueUrl } = this.getUrls(source, issueHref);

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira' };
        }
    }

    class JiraAgile extends JiraBase implements WebToolIntegration {

        observeMutations = true;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var detailSection = $$('#ghx-detail-head');
            if (detailSection) {
                var container = $$.create('div');
                container.appendChild(linkElement);

                detailSection.appendChild(container);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            // seek specific element for Agile Desk and check if detail view is visible
            if (!$$('#ghx-rabid #ghx-detail-issue')) {
                return;
            }

            var issueName = $$.try('dd[data-field-id=summary]').textContent;
            if (!issueName) {
                // nothing to do without issue name
                return;
            }

            var propertyLink = $$('dd[data-field-id=issuekey]');

            var issueId = propertyLink.textContent;

            var issueHref = $$('a', propertyLink).getAttribute('href');

            var projectName = $$('.ghx-project').textContent;

            var { serviceUrl, issueUrl } = this.getUrls(source, issueHref);

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira' };
        }
    }

    IntegrationService.register(new Jira(), new JiraAgile());
}