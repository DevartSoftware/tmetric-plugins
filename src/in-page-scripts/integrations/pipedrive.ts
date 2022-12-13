class Pipedrive implements WebToolIntegration {

    showIssueId = false;

    matchUrl = /.*:\/\/.*.pipedrive.com(\/deal\/(\d+))/;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$.visible('.dealDetails .actionsContent .stateActions');
        if (host) {
            let container = $$.create('span');
            container.classList.add('content', 'relatedItems');

            let span = $$.create('span');
            span.classList.add('relatedItem', 'devart-timer-link-pipedrive');
            span.appendChild(linkElement);

            container.appendChild(span);

            host.insertBefore(container, host.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let matches = source.fullUrl.match(this.matchUrl);
        let issueId = matches[2];
        let issueName: string;
        let title = $$.visible('.dealDetails .descriptionHead .title');
        if (title) {
            issueName = title.textContent;
        }

        let serviceUrl = source.protocol + source.host;
        let issueUrl = matches[1];

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'Pipedrive' };
    }
}

IntegrationService.register(new Pipedrive());