class Linear implements WebToolIntegration {

    showIssueId = true;

    matchUrl = ["*://linear.app/*"];

    getIssue(_issueElement: HTMLElement, source: Source) {

        // extract issue title
        const issueName = $$('div[contenteditable="true"][aria-multiline="false"] > p')
            ?.textContent
            ?.trim();
        if (!issueName) {
            return;
        }

        // example: /YOUR_WORKSPACE/issue/TES-123/YOUR_ISSUE_TITLE
        const match = RegExp(/^\/([^/]+)\/issue\/([^/]+)/).exec(source.path);
        if (!match) {
            return;
        }

        const [, workspace, issueId] = match;

        const serviceType = 'Linear';
        const serviceUrl = source.protocol + source.host;
        const issueUrl = `/${workspace}/issue/${issueId}`

        // try to extract project name
        const projectIcon = $$('button[data-detail-button="true"] use[href="#Project"]');
        const projectButton = projectIcon && $$.closest<HTMLButtonElement>('button', projectIcon as unknown as HTMLElement);
        const projectName = projectButton?.querySelector('span')?.textContent?.trim();

        // try to extract labels
        const labelsContainer = $$.all('[data-details-pane-section-content="true"]')
            .find(content => content.previousElementSibling?.textContent?.trim() === 'Labels');
        const tagNames = labelsContainer
            ? $$.all('[aria-hidden="true"][style*="background"]', labelsContainer)
                .map(dot => dot.parentElement?.textContent?.trim())
                .filter(name => !!name)
            : [];

        return {
            issueId, issueName, serviceType, serviceUrl, issueUrl, projectName, tagNames
        } as WebToolIssue;
    }

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        // insert the TMetric button into the header
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(linkElement);
        }
    }
}

IntegrationService.register(new Linear());