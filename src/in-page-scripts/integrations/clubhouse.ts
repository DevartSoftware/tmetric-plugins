class Clubhouse implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://app.clubhouse.io/*/story/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('.right-column', issueElement);
        if (host) {
            let linkContainer = $$.create('div', 'devart-timer-link-clubhouse');
            linkContainer.appendChild(linkElement);
            host.appendChild(linkContainer);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueId = $$.try<HTMLInputElement>('input[class=clipboard]', issueElement).value;
        const issueName = $$.try('h2.story-name').textContent;
        const serviceUrl = source.protocol + source.host;
        const issueUrl = source.path;
        const projectName = $$.try('.story-epic .value').textContent;
        const tagNames = $$.all('.story-labels .tag', issueElement).map(label => label.textContent);

        return {
            issueId,
            issueName,
            issueUrl,
            projectName,
            serviceUrl,
            serviceType: 'Clubhouse',
            tagNames
        };
    }
}

IntegrationService.register(new Clubhouse());