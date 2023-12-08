class GoogleDocs implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://docs.google.com/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const host = $$('#docs-menubar');
        if (host) {
            host.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const issueName = (<any>$$.try('#docs-titlebar .docs-title-input')).value;
        if (!issueName) {
            return;
        }

        let issueUrl: string | undefined;
        let issueId: string | undefined;

        const matches = source.path.match(/\/.+\/d\/([a-zA-Z0-9_\-]+)\/edit/);

        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'GoogleDocs'

        return {
            issueId, issueName, issueUrl, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new GoogleDocs());