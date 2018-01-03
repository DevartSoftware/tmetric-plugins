class Producteev implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://www.producteev.com/workspace/t/*';

    issueElementSelector = [
        '.td-content > .title',
        '.td-attributes ul.subtasks-list li'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            linkElement.classList.add('devart-timer-link-producteev');
            issueElement.appendChild(linkElement);
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-producteev-minimal');
            issueElement.insertBefore(linkElement, issueElement.querySelector('.close'))
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Urls:
        // https://www.producteev.com/workspace/t/TASK_ID
        // https://www.producteev.com/workspace/t/TASK_ID/calendar
        // https://www.producteev.com/workspace/t/TASK_ID/activity
        var match = /^\/workspace\/t\/(\w+)(\/calendar|\/activity)?$/.exec(source.path);
        if (!match) {
            return;
        }

        var issueId = match[1];
        if (!issueId) {
            return;
        }

        let issueName: string;
        if (issueElement.matches(this.issueElementSelector[0])) {
            issueName = $$.try('.title', issueElement.closest('.td-content').querySelector('.title-header')).textContent;
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            issueName = $$.try('.title', issueElement).textContent;
        }

        var projectName = $$.try('.dropdown-project .title').textContent;

        var serviceType = 'Producteev';

        var serviceUrl = source.protocol + source.host;

        var issueUrl = '/workspace/t/' + match[1];

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Producteev());