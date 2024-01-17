class Monday implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://*.monday.com/*';

    issueElementSelector = [
        '.slide-panel-content',
        '.pulse-card-dialog-component',
        '.modal-slide-panel .pulse-values-and-header-wrapper',
        '.pulse-component-wrapper'
    ];

    private _latestPulseElement: HTMLElement | undefined;

    constructor() {
        document.addEventListener('click', event => {
            const element = event.target as HTMLElement;
            if (!element.matches) {
                return;
            }
            const pulseElement = $$.closest('.pulse-component', element);
            if (pulseElement) {
                this._latestPulseElement = pulseElement; // remember pulse
            } else if (this._latestPulseElement && element.parentElement) { // ignore unlinked elements
                let selector = [
                    ...this.issueElementSelector, // ignore clicks within the task itself
                    '.dialog-node', // ignore pop-up dialogs (e.g. person selector)
                    '.system-notice-container' // ignore notices (e.g. popping undo)
                ].join(',');
                if (!$$.closest(selector, element)) {
                    this._latestPulseElement = undefined; // forget pulse
                }
            }
        });
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueName: string | null | undefined;
        let issueId: string | undefined; 
        let issueUrl: string | undefined;
        let projectName: string | null | undefined;

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
        } else if (issueElement.matches(this.issueElementSelector[3])) { // list item in My Work and Boards pages
            issueName = $$.try('div[data-walkthrough-id="item-name-text"]', issueElement).textContent;
            // find issue ulr on 'My Work' page
            issueUrl = $$.try<HTMLAnchorElement>('.pulse-component .board-cell-component a', issueElement).href;
            if (!issueUrl) { // if issue url didn't find, than parse id and create url manually
                const rowId = $$.try('.pulse-component', issueElement).id;
                const idMatch = rowId?.match(/row-pulse-+(\d+)-\w+/);
                const boardMatch = source.path?.match(/\/boards\/\d+/);
                if (idMatch && boardMatch) {
                    issueUrl = `${boardMatch[0]}/pulses/${idMatch[1]}`;
                }
            }
            projectName = $$.try('.board-header-main .board-name').textContent // on boards page
                || $$.try('.pulse-component .board-cell-component a', issueElement).textContent; // on My Work page
        }

        if (!issueName) {
            return;
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Monday';

        if (issueUrl) {
            issueUrl = $$.getRelativeUrl(serviceUrl, issueUrl);
            const matches = issueUrl.match(/\/boards\/(\d+).*\/pulses\/(\d+)/);
            if (matches) {
                issueUrl = `/boards/${matches[1]}/pulses/${matches[2]}`;
                issueId = matches[2];
            } else {
                issueUrl = undefined;
            }
        }

        return {
            issueId, issueName, issueUrl, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let isListPage = false;

        if (issueElement.matches(this.issueElementSelector[0])) { // side panel on board page
            const hostElement = $$('.pulse_title', issueElement);
            if (hostElement) {
                hostElement.appendChild(linkElement);
            }
        } else if (issueElement.matches(this.issueElementSelector[1])) { // my week page (legacy)
            const hostElement = $$('.link-to-pulse');
            if (hostElement) {
                linkElement.style.marginLeft = '10px';
                hostElement.appendChild(linkElement);
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) { // my work page
            const hostElement = $$('.link-to-pulse');
            if (hostElement) {
                linkElement.style.marginLeft = '10px';
                hostElement.appendChild(linkElement);
            }
        } else if (issueElement.matches(this.issueElementSelector[3])) { // in list in dashboards or My Work pages
            isListPage = true;
            const hostElement = $$('.name-cell-component-side-cell', issueElement);
            if (hostElement) {
                linkElement.classList.add('devart-timer-link-monday');
                hostElement.insertBefore(linkElement, hostElement.firstChild);
            }
        }

        if (!linkElement.parentElement && !isListPage) { // fallback - add as first element
            linkElement.style.paddingLeft = '10px';
            issueElement.insertBefore(linkElement, issueElement.firstChild);
        }
    }
}

IntegrationService.register(new Monday());