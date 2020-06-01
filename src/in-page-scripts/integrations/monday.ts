class Monday implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = 'https://*.monday.com/*';

    issueElementSelector = [
        '.pulse-component-wrapper',
        '.slide-panel-content',
        '#pulse-card-dialog-component'];

    private static _lastClickedElement: HTMLElement;

    constructor() {
        document.addEventListener('click', this.saveClickedElement);
    }

    saveClickedElement(event: Event) {
        Monday._lastClickedElement = event.target as HTMLElement;
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) {

            let nameComponent = $$('[id$=-name].col-identifier-name .name-cell-component', issueElement);
            if (nameComponent) {
                let div = $$.create('div', 'devart-timer-link-monday-icon');
                linkElement.lastElementChild.textContent = '';
                div.appendChild(linkElement);
                nameComponent.lastChild.before(div);
            }
        }

        if (issueElement.matches(this.issueElementSelector[1])) {

            let updateTab = $$.all('#pulse-content > .tab', issueElement)[0];
            if (updateTab) {
                let div = $$.create('div', 'devart-timer-link-monday-slide-panel');
                div.appendChild(linkElement);
                updateTab.firstChild.after(div);
            }
        }

        if (issueElement.matches(this.issueElementSelector[2])) {
            let container = $$.try('.top-actions-container', issueElement);
            linkElement.classList.add('devart-timer-link-monday-card-dialog');
            container.firstChild.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName;
        let issueId;
        let issueUrl;
        let projectName = $$('.board-name').textContent;

        // board
        if (issueElement.matches(this.issueElementSelector[0])) {
            let colName = $$('[id$=-name].col-identifier-name', issueElement)
            if (colName) {
                issueName = $$.try('.name-cell-text', colName).textContent;
                issueId = colName.id.match(/(?<=focus-)\d*?(?=-name)/)[0];
                let path = source.path.endsWith('/') ? source.path : `${source.path}/`;
                issueUrl = issueId && `${path}pulses/${issueId}`;
            }
        }

        // side panel on board page
        if (issueElement.matches(this.issueElementSelector[1])) {
            issueName = $$.try('.title-wrapper', issueElement).textContent;
            issueId = source.path.match(/\/(?:pulses)\/([^\/]+)/)[1];
            issueUrl = source.path;
        }

        // modal window on my week page
        if (issueElement.matches(this.issueElementSelector[2])) {
            issueName = $$.try('.pulse-name-value', issueElement).textContent;
            projectName = $$.try('.open-pulse-in-board-link').textContent;
            if (Monday._lastClickedElement) {
                let task = this.getTaskContentElement(Monday._lastClickedElement);
                if (task) {
                    let link = $$('.pulse-name-wrapper > a', task) as HTMLAnchorElement;

                    issueId = link.pathname.match(/(?<=pulses\/)(\d*)(?=\/|\?|.*)/)[0];
                    issueUrl = link.pathname;
                }
            }

            if (!issueId) {
                {
                    let boardPath = ($$.try('.open-pulse-in-board-link', issueElement) as HTMLAnchorElement).pathname;
                    let links = $$.all(`.pulse-name-wrapper a[href*="${boardPath}"]`);
                    let link = links.find(link => link.textContent == issueName);
                    if (link) {
                        issueId = (<HTMLAnchorElement>link).pathname.match(/(?<=pulses\/)(\d*)(?=\/|\?|.*)/)[0];
                        issueUrl = (<HTMLAnchorElement>link).pathname;
                    }
                }
            }
        }

        let serviceUrl = source.protocol + source.host

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Monday' }
    }

    getTaskContentElement(el: HTMLElement): HTMLElement {

        if (!el) {
            return;
        }

        if (el.classList.contains('deadline-task-component-content')) {
            return el;
        }

        return this.getTaskContentElement(el.parentElement);
    }
}

IntegrationService.register(new Monday());