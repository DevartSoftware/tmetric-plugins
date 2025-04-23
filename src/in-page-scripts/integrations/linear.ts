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
        const projectName = $$(`[data-discover="true"][href^="/${workspace}/project"]`)
            ?.parentElement
            ?.textContent;

        // try to extract labels
        const tagNames = $$.all('[aria-hidden="true"][color]')
            .map(tagIcon => tagIcon.parentElement)
            .filter(tag => !!$$.closest('div', tag!.parentElement!, parent => !!parent.textContent?.startsWith('Labels')))
            .map(tag => tag?.textContent);

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
