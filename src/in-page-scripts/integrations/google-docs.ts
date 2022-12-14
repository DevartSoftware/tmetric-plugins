class GoogleDocs implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://docs.google.com/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('#docs-menubar');
        if (host) {
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = (<any>$$.try('#docs-titlebar .docs-title-input')).value;
        if (!issueName) {
            return;
        }

        let issueUrl: string;
        let issueId: string;

        let matches = source.path.match(/\/.+\/d\/([a-zA-Z0-9_\-]+)\/edit/);

        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'GoogleDocs' };
    }
}

IntegrationService.register(new GoogleDocs());