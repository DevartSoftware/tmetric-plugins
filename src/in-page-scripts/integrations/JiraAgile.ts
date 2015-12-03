module Integrations {

    class JiraAgileIntegration implements WebToolIntegration {

        observeMutations = true;

        match(source: Source): boolean {
            var jiraAppQuery = $$('meta[name=application-name]');
            if (jiraAppQuery) {
                return jiraAppQuery.getAttribute('content') == 'JIRA';
            }

            return false;
        }

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

            var issueName = $$('dd[data-field-id=summary]', true).textContent;
            if (!issueName) {
                // nothing to do without issue name
                return;
            }

            var propertyLink = $$('dd[data-field-id=issuekey]');

            var issueId = propertyLink.textContent;

            var issueUrl = $$('a', propertyLink).getAttribute('href');

            var projectName = $$('.ghx-project').textContent;

            var serviceUrl = source.protocol + source.host;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira' };
        }
    }

    IntegrationService.register(new JiraAgileIntegration());
}