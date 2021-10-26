class Nifty implements WebToolIntegration {

    matchUrl = '*://*.nifty.pm/*/task/*';

    issueElementSelector = [
        '.content-panel:not(.content-panel-subview)',
        '.content-panel .subtask-item:not(.new)'
    ];

    showIssueId = true;

    observeMutations = true;

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let description = '';
        if (issueElement.matches(this.issueElementSelector[1])) {
            description = $$.try('.item-title', issueElement).textContent;
            issueElement = $$.closest(this.issueElementSelector[0], issueElement);
        }

        const issueId = $$.try('.nice-id', issueElement).textContent;
        const issueName = $$.try('.content-panel-field-input', issueElement).textContent;
        const projectName = $$.try('.header-title h1').textContent;

        const serviceUrl = source.fullUrl.split('task')[0];
        const issueUrl = `task/${issueId}`;

        const tagNames = $$.all('.labels-list-item-text', issueElement).map(_ => _.textContent);

        return {
            issueId,
            issueName,
            issueUrl,
            description,
            projectName,
            serviceUrl,
            serviceType: 'Nifty',
            tagNames
        };
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            const actions = $$('.content-panel-simple-actions', issueElement);
            if (actions) {
                linkElement.classList.add('devart-timer-link-minimal', 'content-panel-simple-action-inner');
                const container = $$.create('div', 'content-panel-simple-action');
                container.appendChild(linkElement);
                actions.appendChild(container);
            }
        }
        else {
            const actions = $$('.item-utils', issueElement);
            if (actions) {
                linkElement.classList.add('devart-timer-link-minimal', 'item-click-action', 'util');
                actions.insertBefore(linkElement, actions.firstElementChild);
            }
        }
    }
}

IntegrationService.register(new Nifty());