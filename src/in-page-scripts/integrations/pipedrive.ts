class Pipedrive implements WebToolIntegration {

    showIssueId = false;

    matchUrl = /.*:\/\/.*.pipedrive.com(\/deal\/\d+)/;

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('.dealDetails .actionsContent .stateActions');
        if (host) {
            let container = $$.create('span');
            container.classList.add('input', 'spinWrapper', 'lost');
            linkElement.classList.add('devart-timer-link-pipedrive');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueId = source.path.match(/\d+/)[0];
        let issueName = $$.try('.dealDetails .descriptionHead .title').textContent;
        let serviceUrl = source.protocol + source.host;
        let issueUrl: string;
        let matches = source.fullUrl.match(this.matchUrl);
        if (matches) {
            issueUrl = matches[1];
        }

        let projectName = '';

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Pipedrive' };
    }
}

IntegrationService.register(new Pipedrive());