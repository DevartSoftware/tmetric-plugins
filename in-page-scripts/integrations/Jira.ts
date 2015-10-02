/// <reference path="../../interfaces/integrations" />
/// <reference path="../IntegrationService" />
/// <reference path="../utils" />

module Integrations {
    class Jira implements WebToolIntegration {
        match(source: Source): boolean {
            var jiraAppQuery = $$('meta[name=application-name]');
            if (jiraAppQuery) {
                return jiraAppQuery.getAttribute('content') == 'JIRA';
            }
            return false;
        }

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
            var issueName = $$('#summary-val', true).textContent;
            if (!issueName) {
                return;
            }

            var issueId, issueUrl: string;

            var issueLink = $$('.issue-link', true);
            if (issueLink) {
                issueId = issueLink.getAttribute('data-issue-key');

                issueUrl = issueLink.getAttribute('href');
            }

            // First selector is for separate task view (/browse/... URL). The second selector is for Service Desk view.
            var projectName = $$('#project-name-val', true).textContent || $$('.project-title > a', true).textContent;

            var serviceUrl = source.protocol + source.host;

            // for case when jira installed outside domain root we should append context path to serviceUrl and remove it from issueUrl
            // https://issues.apache.org/jira/
            // ajs-context-path = /jira
            // serviceUrl = http://jira.local
            // issueUrl = /jira/browse/tt-1 
            var jiraContextPath = $$('meta[name=ajs-context-path]').getAttribute('content');
            if (jiraContextPath) {
                serviceUrl += jiraContextPath;

                if (issueUrl.indexOf(jiraContextPath)) {
                    // we suppose that issueUrl must begin with context path; if not, raise the error.
                    console.error('Time tracker extension was unable to parse the Jira page. Something wrong with Jira context URL and issue URL.');
                    return;
                }

                issueUrl = issueUrl.substr(jiraContextPath.length);
            }

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira' };
        }
    }

    IntegrationService.register(new Jira());
}