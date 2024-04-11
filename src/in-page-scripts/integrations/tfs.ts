class TfsIntegration implements WebToolIntegration {

    showIssueId = true;

    matchUrl = [
        // Visual Studio Team Services
        '*://*.visualstudio.com/*',
        // Azure DevOps / Team Foundation Server
        '*://*/_home*',
        '*://*/_boards*',
        '*://*/_dashboards*',
        '*://*/_backlogs*',
        '*://*/_workitems*',
        '*://*/_sprints*',
        '*://*/_queries*',
    ];

    issueElementSelector = () => $$.all('.work-item-form, .work-item-form-page');

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        const host = $$.visible('.work-item-form-headerContent, .work-item-header-command-bar', issueElement);
        if (host) {
            const linkContainer = $$.create('div', 'devart-timer-link-tfs');
            linkContainer.appendChild(linkElement);
            host.insertBefore(linkContainer, host.firstElementChild);            
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issue = (<HTMLInputElement>$$.visible('.work-item-form-title input, .work-item-title-textfield input', issueElement));
        let issueName = issue && issue.value;

        if (!issueName) {
            // nothing to do without issue name
            return;
        }

        // find the nearest anchor with task link
        let issueId: string | undefined;
        let issueUrl: string | undefined;

        let parent: HTMLElement | undefined | null = issueElement;
        while (parent) {
            for (const issueUrlElement of $$.all('a', parent)) {

                // /ProjectName/_workitems/edit/1
                // /ProjectName/_workitems/edit/1?fullScreen=false
                const issueIdRegExp = /(.+\/edit\/(\d*))(\?.*)?$/.exec(issueUrlElement.getAttribute('href')!);
                if (issueIdRegExp) {
                    issueUrl = issueIdRegExp[1];
                    issueId = '#' + issueIdRegExp[2];
                    parent = null;
                    break;
                }
            }
            parent = parent?.parentElement;
        }

        const tagNames = $$.all('span.tag-box.tag-box-delete-experience, .work-item-tag-picker .bolt-pill-content', issueElement)
            .map(label => label.textContent);

        // https://devart.visualstudio.com/
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'TFS';

        const itemView = $$.visible('.work-item-view, .work-item-form-subheader', issueElement);
        const projectInput = itemView && $$('input[aria-label="projectName"]', itemView) // custom layout
                || $$('input[aria-label="Area Path"], input[id=__bolt--Area-input]', itemView) // new layout
                || $$('.work-item-form-areaIteration input', issueElement) // old layout
        const projectName = projectInput && (<HTMLInputElement>projectInput).value;

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }
}

IntegrationService.register(new TfsIntegration());