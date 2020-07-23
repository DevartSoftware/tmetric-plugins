class ClubHouse implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://app.clubhouse.io/*/story/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.right-column', issueElement);
        if (host) {
            let linkContainer = $$.create('div', 'devart-timer-link-clubhouse');
            linkContainer.appendChild(linkElement);
            host.appendChild(linkContainer);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        var issueId = $$.try<HTMLInputElement>('input[class=clipboard]', issueElement).value;
        var issueName = $$.try('h2.story-name').textContent;
        var serviceUrl = source.protocol + source.host;
        var issueUrl = source.path;
        var projectName = $$.try('.story-epic .value').textContent;
        var tagNames = $$.all('.story-labels .tag', issueElement).map(label => label.textContent);

        return {
            issueId,
            issueName,
            issueUrl,
            projectName,
            serviceUrl,
            serviceType: 'ClubHouse',
            tagNames
        };
    }
}

IntegrationService.register(new ClubHouse());