class Pipedrive implements WebToolIntegration {

    showIssueId = false;

    matchUrl = /.*:\/\/.*.pipedrive.com(\/deal\/(\d+))/;

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('.dealDetails .actionsContent .stateActions');
        if (host) {
            let container = $$.create('span');
            container.classList.add('input', 'spinWrapper', 'lost');

            let span = $$.create('span');
            span.classList.add('devart-timer-link-pipedrive', 'button');
            span.appendChild(linkElement);

            container.appendChild(span);

            host.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueId = source.fullUrl.match(this.matchUrl)[2];
        let issueName = $$.try('.dealDetails .descriptionHead .title').textContent;
        let serviceUrl = source.protocol + source.host;
        let issueUrl = source.fullUrl.match(this.matchUrl)[1];
        let projectName = '';

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Pipedrive' };
    }
}

IntegrationService.register(new Pipedrive());