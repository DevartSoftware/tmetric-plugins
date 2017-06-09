module Integrations {

    class PivotalTracker implements WebToolIntegration {

        showIssueId = true;

        observeMutations = true;

        matchUrl = '*://www.pivotaltracker.com/*';

        issueElementSelector = '.story .model_details';

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

            var projectName: string;

            // single task page
            var projectLinks = $$.all('.project > h2 > a');
            if (projectLinks.length == 1) {
                projectName = projectLinks[0].textContent;
            }

            if (!projectName) {
                if ($$('.sidebar_content .projects')) {
                    // workspace page
                    let panel = $$.closest('.panel', issueElement);
                    if (panel) {
                        let panelType = panel.getAttribute('data-type');
                        // Project name can not be resolved for a task on "Search" and "My Work" panels
                        if (panelType && panelType != 'search' && panelType != 'my_work') {
                            projectName = $$.try('[class^="tn-PanelHeader__heading"]', panel).textContent;
                        }
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