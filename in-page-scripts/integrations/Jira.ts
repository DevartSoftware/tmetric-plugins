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
            // reserved for inlining TT button
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

            // Selector '#project-name-val' is for separate task view (/browse/... URL). Selector '.project-title' is for Service Desk view.
            var projectName = $$('#project-name-val').textContent || $$('.project-title').textContent;

            var serviceUrl = source.protocol + source.host;

            var serviceType = 'Jira';

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

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
        }
    }
    IntegrationService.register(new Jira());
}