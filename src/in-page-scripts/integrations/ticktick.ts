class Ticktick implements WebToolIntegration {

    showIssueId = true;

    matchUrl = 'https://ticktick.com/*';

    issueElementSelector = [
        '.task',
        '#task-detail-inner'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const container = $$.create('span');
        linkElement.classList.add('option');
        container.classList.add('devart-timer-tick-tick');
        container.appendChild(linkElement);
        if (issueElement.matches(this.issueElementSelector[0])) {

            var blockToAdd = $$('.title', issueElement);
            blockToAdd.appendChild(container);
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            var blockToAdd = $$('.timecard-wrap', issueElement);
            blockToAdd.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        const issueName = $$.try('.title > span', issueElement).textContent ||
            $$.try('.CodeMirror-code span', issueElement).textContent;
        if (!issueName) {
            return;
        }

        // get identifier from href or from top task in single view
        let issueId: string;
        let issueUrl: string;
        const issueHref = $$.getAttribute('a', 'taskid', issueElement);
        if (issueHref) {
            issueId = '#' + issueHref;
            const groupId = $$.getAttribute('.l-folder', 'groupid');
            issueUrl = '/webapp/#g/' + groupId + '/tasks/' + issueHref;
        }
        if (!issueId) {
            const url = source.fullUrl;
            const parsedUrl = new URL(url);
            let match = /tasks\/(\w+)/.exec(url);
            if (match) {
                issueId = '#' + match[1];
                issueUrl = '/' + parsedUrl.hash;
            }
        }

        let projectName: string;

        const projectInput = $$<HTMLInputElement>('.project-setting input', issueElement);
        if (projectInput) {
            projectName = projectInput.value;
        }

        if (!projectName) {
            const projectSpan = $$('.project-name', issueElement);
            if (projectSpan) {
                projectName = projectSpan.textContent;
            }
        }

        if (!projectName) {
            const projectNameElement = $$('#project-name-bar h5');
            if (projectNameElement) {
                projectName = projectNameElement.textContent;
            }
        }

        let tagNames = $$.all('.tag-list a', issueElement).map(_ => _.textContent);

        const serviceType = 'TickTick';

        const serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new Ticktick());