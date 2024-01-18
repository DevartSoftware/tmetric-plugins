class Pipedrive implements WebToolIntegration {

    showIssueId = false;

    matchUrl = /.*:\/\/.*.pipedrive.com(\/deal\/(\d+))/;

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = document.querySelector('[data-testid="followersButton"]'); 
        if (host) {
            let container = $$.create('span');
            container.classList.add('content', 'relatedItems');

            let span = $$.create('span');
            span.classList.add('relatedItem', 'devart-timer-link-pipedrive');
            span.appendChild(linkElement);

            container.appendChild(span);

            host.parentElement!.insertBefore(container, host.parentElement!.firstElementChild);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {
        let matches = source.fullUrl.match(this.matchUrl)!;
        let issueId = matches[2];
        let issueName: string | undefined | null;
        
        let titleElement = document.querySelector('[data-testid="header-title"]');
        const title = $$.try('textarea', titleElement);
        if (title) {
            issueName = title.textContent;
        }

        const serviceType = 'Pipedrive';
        const serviceUrl = source.protocol + source.host;
        const issueUrl = matches[1];

        return {
            issueId, issueName, issueUrl, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new Pipedrive());