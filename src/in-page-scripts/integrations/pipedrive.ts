class Pipedrive implements WebToolIntegration {

    showIssueId = false;

    matchUrl = [
        '*://*.pipedrive.com/deal/\d+',
        '*://*.pipedrive.com/deal/*'
    ];

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
        let issueId = source.path;
        let issueName = $$.try('.dealDetails .descriptionHead .title').textContent;
        let serviceUrl = source.protocol + source.host;
        let issueUrl = source.path;
        let projectName = 'sales';

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Pipedrive' };
    }
}

IntegrationService.register(new Pipedrive());