class Monday implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://*.monday.com/*';

    issueElementSelector = [
        '.slide-panel-content',
        '.pulse-card-dialog-component',
        '.modal-slide-panel .pulse-values-and-header-wrapper',
        '.pulse-component-wrapper'
    ];

    private _latestPulseElement: HTMLElement;

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
            if (!issueUrl) { // if issue url didn't find, than parse id and create url manually
                const idMatch = this._latestPulseElement?.id?.match(/row-pulse-+(\d+)-\w+/);
                const boardUrl = $$.try<HTMLAnchorElement>('.open-pulse-in-board-link', issueElement).pathname;
                if (idMatch && boardUrl) {
                    issueUrl = `${boardUrl}/pulses/${idMatch[1]}`;
                }
            }

            projectName = $$.try('.open-pulse-in-board-link').innerText;
        } else if (issueElement.matches(this.issueElementSelector[3])) { // list item in My Work and Boards pages
            issueName = $$.try('.name-cell-text', issueElement).textContent;
            // find issue ulr on 'My Work' page
            issueUrl = $$.try<HTMLAnchorElement>('.pulse-component .board-cell-component a', issueElement).href;
            if (!issueUrl) { // if issue url didn't find, than parse id and create url manually
                const rowId = $$.try('.pulse-component', issueElement).id;
                const idMatch = rowId?.match(/row-pulse-+(\d+)-\w+/);
                let boardMatch = source.path?.match(/\/boards\/\d+/); // on boards page
                let boardUrl = boardMatch ? boardMatch[0] : null;
                if (!boardUrl) {
                    boardMatch = issueElement.className.match(/board-id-(\d+)/); // on My Work page
                    if (boardMatch) {
                        boardUrl = `/boards/${boardMatch[1]}`;
                    }
                }

                if (idMatch && boardUrl) {
                    issueUrl = `${boardUrl}/pulses/${idMatch[1]}`;
                }
            }
            projectName = $$.try('.board-header-main .board-name').textContent // on boards page
                || $$.try('.pulse-component .file-breadcrumbs-component ol li:first-child', issueElement).textContent // on My Work page
                || $$.try('.col-identifier-board', issueElement).textContent; // old My Work page
        }

        if (!issueName) {
            return;
        }

        const serviceUrl = source.protocol + source.host;

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

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Monday' };
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