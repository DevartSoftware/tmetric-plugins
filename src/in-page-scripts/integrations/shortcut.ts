class Shortcut implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://app.shortcut.com/*/story/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('.right-column', issueElement);
        if (host) {
            const linkContainer = $$.create('div');
            linkContainer.appendChild(linkElement);
            host.appendChild(linkContainer);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueName = $$.try('h2.story-name').textContent;
        const issueId = $$.try<HTMLInputElement>('.story-id input.clipboard', issueElement).value;
        const serviceUrl = source.protocol + source.host;
        const issueUrl = source.path.replace(/\/story\/.*/, '/story/' + issueId);
        const projectName = $$.try('.story-project .value').textContent;
        const tagNames = $$.all('.story-labels .tag', issueElement).map(label => label.textContent);

        return {
            issueId,
            issueName,
            issueUrl,
            projectName,
            serviceUrl,
            serviceType: 'Shortcut',
            tagNames
        };
    }
}

IntegrationService.register(new Shortcut());