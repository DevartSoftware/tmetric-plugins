class Monday implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = 'https://*.monday.com/*';

    issueElementSelector = [
        '.slide-panel-content',
        '.pulse-card-dialog-component',
        '.modal-slide-panel .pulse-values-and-header-wrapper'
    ];

    private _latestPulseElement: HTMLElement;

    constructor() {
        document.addEventListener('click', event => {
            const element = event.target as HTMLElement;
            if (!element.matches) {
                return;
            }
            this._latestPulseElement = $$.closest('.pulse-component', element);
        });
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName: string;
        let issueId: string;
        let issueUrl: string;
        let projectName: string;

        if (issueElement.matches(this.issueElementSelector[0])) { // side panel on board page
            issueName = $$.try('.title-wrapper', issueElement).textContent;
            issueUrl = source.path;
            projectName = $$.try('.board-header-main .board-name').textContent;
        } else if (issueElement.matches(this.issueElementSelector[1])) { // my week page (legacy)
            issueName = $$.try('.pulse-name-value', issueElement).textContent;
            projectName = $$.try('.open-pulse-in-board-link').innerText;
        } else if (issueElement.matches(this.issueElementSelector[2])) { // my work page
            issueName = $$.try('.pulse-page-name-wrapper', issueElement).textContent;
            issueUrl = this._latestPulseElement &&
                $$.try<HTMLAnchorElement>('.board-cell-component a', this._latestPulseElement).href;
            projectName = $$.try('.open-pulse-in-board-link').innerText;
        }

        const serviceUrl = source.protocol + source.host;

        if (issueUrl) {
            issueUrl = $$.getRelativeUrl(serviceUrl, issueUrl);
            const matches = issueUrl.match(/pulses\/(\d+)/);
            issueId = matches ? matches[1] : null;
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Monday' };
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) { // side panel on board page
            const hostElement = $$('.pulse_title', issueElement);
            if (hostElement) {
                hostElement.appendChild(linkElement);
            }
        } else if (issueElement.matches(this.issueElementSelector[1])) { // my week page (legacy)
            const hostElement = $$('.link-to-pulse');
            if (hostElement) {
                Object.assign(linkElement.style, { marginLeft: '10px' } as CSSStyleDeclaration);
                hostElement.appendChild(linkElement);
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) { // my work page
            const hostElement = $$('.link-to-pulse');
            if (hostElement) {
                Object.assign(linkElement.style, {
                    marginLeft: '10px'
                } as CSSStyleDeclaration);
                hostElement.appendChild(linkElement);
            }
        }

        if (!linkElement.parentElement) { // fallback - add as first element
            Object.assign(linkElement.style, { paddingLeft: '10px' } as CSSStyleDeclaration);
            issueElement.insertBefore(linkElement, issueElement.firstChild);
        }
    }
}

IntegrationService.register(new Monday());