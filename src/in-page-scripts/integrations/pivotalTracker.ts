class PivotalTracker implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://www.pivotaltracker.com/*';

    issueElementSelector = '.story .model_details';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('aside > .wrapper', issueElement);
        if (host) {
            let linkContainer = $$.create('div', 'devart-timer-link-pivotaltracker');
            linkContainer.appendChild(linkElement);
            host.appendChild(linkContainer);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const issueId = $$.try<HTMLInputElement>('.text_value', issueElement).value;
        if (!issueId) {
            return;
        }

        const issueName = $$.try('.name textarea', issueElement).textContent;
        if (!issueName) {
            return;
        }

        let projectName: string | undefined | null;

        // single task page
        const projectLinks = $$.all('.project > h2 > a');
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

        const serviceType = 'PivotalTracker';
        const serviceUrl = source.protocol + source.host;

        const issueUrl = '/story/show/' + issueId.substring(1);

        const closestContainer = $$.closest('.story', issueElement);
        const tagNames = $$.all('.labels_container.full div[data-aid="Label__Name"]', closestContainer).map(label => label.textContent);

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }
}

IntegrationService.register(new PivotalTracker());