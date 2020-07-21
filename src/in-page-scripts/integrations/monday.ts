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

        let issueName: string;
        let issueId: string;
        let issueUrl: string;
        let projectName = $$.try('.board-header-main .board-name').textContent;

        // board
        if (issueElement.matches(this.issueElementSelector[0])) {
            let colName = $$('[id$=-name].col-identifier-name', issueElement)
            if (colName) {
                issueName = $$.try('.name-cell-text', colName).textContent;
                let match = colName.id.match(/focus-(\d+)-name/);
                issueId = match && match[1];
                issueUrl = this.createIssueUrl(source.path, issueId);
            }
        }

        // side panel on board page
        if (issueElement.matches(this.issueElementSelector[1])) {
            issueName = $$.try('.title-wrapper', issueElement).textContent;
            let isSubItem = $$('.title-wrapper .with-subitem', issueElement);
            if (isSubItem) {
                if (Monday._lastClickedElement) {
                    let task = $$.closest('.pulse-component-wrapper.subitem-pulse.subitem .pulse-component', Monday._lastClickedElement);
                    if (task) {
                        let match = task.id.match(/pulse-(\d+)/);
                        issueId = match && match[1];
                        issueUrl = this.createIssueUrl(source.path, issueId);
                    }
                }
            } else {
                issueId = this.getIssueIdByUrlPath(source.path);
                issueUrl = source.path;
            }
        }

        // modal window on my week page
        if (issueElement.matches(this.issueElementSelector[2])) {
            issueName = $$.try('.pulse-name-value', issueElement).textContent;
            projectName = $$.try('.open-pulse-in-board-link').textContent;
            if (Monday._lastClickedElement) {
                let task = $$.closest('.deadline-task-component-content', Monday._lastClickedElement);
                if (task) {
                    let link = $$('.pulse-name-wrapper > a', task) as HTMLAnchorElement;

                    issueId = this.getIssueIdByUrlPath(link.pathname);
                    issueUrl = link.pathname;
                }
            }

            if (!issueId) {
                {
                    let boardPath = ($$.try('.open-pulse-in-board-link', issueElement) as HTMLAnchorElement).pathname;
                    let links = $$.all(`.pulse-name-wrapper a[href*="${boardPath}"]`);
                    let link = links.find(link => link.textContent == issueName);
                    if (link) {
                        issueId = this.getIssueIdByUrlPath((<HTMLAnchorElement>link).pathname);
                        issueUrl = (<HTMLAnchorElement>link).pathname;
                    }
                }
            }
        }

        let serviceUrl = source.protocol + source.host

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Monday' }
    }

    getIssueIdByUrlPath(url: string): string {
        let matches = url.match(/pulses\/(\d+)/);
        return matches ? matches[1] : null;
    }

    createIssueUrl(sourcePath: string, id: string) {
        let match = sourcePath.match(/boards\/\d+/);
        let path = match && match[0];
        return id && `${path}/pulses/${id}`;
    }
}

IntegrationService.register(new Monday());