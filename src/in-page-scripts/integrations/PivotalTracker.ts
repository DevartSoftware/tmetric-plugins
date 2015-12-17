module Integrations {

    class PivotalTracker implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://www.pivotaltracker.com/*';

        issueElementSelector = () => {
            var maximizedElements = $$.all('.maximized .story .model_details');
            if (maximizedElements.length > 0) {
                return maximizedElements;
            }
            return $$.all('.story .model_details');
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('aside > .wrapper', issueElement);
            if (host) {
                let linkContainer = $$.create('div', 'devart-timer-link-pivotaltracker');
                linkContainer.appendChild(linkElement);
                host.appendChild(linkContainer);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueId = $$.try<HTMLInputElement>('.text_value', issueElement).value;
            if (!issueId) {
                return;
            }

            var issueName = $$.try('.editor', issueElement).textContent;
            if (!issueName) {
                return;
            }

            // single task page
            var projectLinks = $$.all('.project > h2 > a');
            if (projectLinks.length == 1) {
                var projectName = projectLinks[0].textContent;
            }

            if (!projectName) {
                if ($$('.sidebar_content .projects')) {
                    // workspace page
                    var container = $$.closest('.panel', issueElement);
                    if (container.id == 'panel_my_work') {
                        // project name can not be resolved for a task on the panel "My Work"
                        projectName = '';
                    } else {
                        projectName = $$.try('.workspace_header.panel_controls > h3', container).textContent;
                    }
                } else {
                    // project page
                    projectName = $$.try('.raw_context_name').textContent;
                }
            }

            var serviceType = 'PivotalTracker';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = '/story/show/' + issueId.substring(1);

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new PivotalTracker());
}