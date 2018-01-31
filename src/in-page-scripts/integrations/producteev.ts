class Producteev implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = [
        '*://www.producteev.com/workspace/t/*',
        '*://producteev.com/workspace/t/*'
    ];

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
        let match = /^\/workspace\/t\/(\w+)(\/calendar|\/activity)?$/.exec(source.path);
        if (!match) {
            return;
        }

        let contentElement = issueElement.closest('.td-content');
        if (!contentElement) {
            return;
        }

        let issueId = match[1];
        let issueName = $$.try('.title-header .title', contentElement).textContent;
        let projectName = $$.try('.dropdown-project .title').textContent;
        let serviceType = 'Producteev';
        let serviceUrl = source.protocol + source.host;
        let issueUrl = '/workspace/t/' + issueId;

        let description: string;
        if (issueElement.matches(this.issueElementSelector[1])) {
            description = $$.try('.title', issueElement).textContent;
        }

        return { issueId, issueName, description, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Producteev());