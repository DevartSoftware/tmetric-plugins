class Ticktick implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://*ticktick.com/webapp*';

    issueElementSelector = '#task-detail-view';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        const blockToAdd = $$('.timecard-wrap', issueElement);
        if (blockToAdd) { // add to task toolbar
            linkElement.classList.add('devart-timer-inherit-label-align');
            blockToAdd.appendChild(linkElement);
        } else { // fallback
            linkElement.style.marginLeft = '20px';
            issueElement.insertBefore(linkElement, issueElement.firstChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.CodeMirror-code span', issueElement).textContent || // tasks or note
            $$.try('header', issueElement).textContent; // habit

        // remove &zerowidthspace; symbols (TMET-8864)
        issueName = issueName.replace(/\u200B/g, '').trim();
        if (!issueName) {
            return;
        }

        let issueId: string;
        let projectId: string;
        let issueUrl: string;

        // List/Kanban/Inbox
        let match = source.fullUrl.match(/#p\/(\w+)\/(?:tasks|kanban)\/(\w{24,})/);
        if (match) {
            projectId = match[1]; // id or 'inbox'
            issueId = match[2];
        }

        // Today/Next 7 Days
        if (!issueId) {
            match = source.fullUrl.match(/#q\/.*\/(\w{24,})/);
            issueId = match && match[1];
        }

        // Eisenhower Matrix
        if (!issueId) {
            match = source.fullUrl.match(/#m.*\/quadrant[1-4]\/(\w{24,})/);
            issueId = match && match[1];
        }

        // Tags
        if (!issueId) {
            match = source.fullUrl.match(/#.*\/tasks\/(\w{24,})/);
            issueId = match && match[1];
        }

        if (issueId && issueId.length === 24) {
            if (!projectId) {
                // try to find hidden project link on page
                projectId = $$.getAttribute(`a[taskId="${issueId}"]`, 'projectId');
            }
            if (!projectId || projectId.startsWith('inbox')) { // inbox has internal id like inbox12345
                projectId = 'inbox';
            }
            issueUrl = `/webapp/#p/${projectId}/tasks/${issueId}`;
        }

        const tagNames = $$.all('.tag-list .tag-name', issueElement).map(_ => _.textContent);

        const serviceType = 'TickTick';
        let host = source.host;
        if (host.startsWith('www.')) {
            host = host.substring(4);
        }
        const serviceUrl = source.protocol + host;

        return { issueId, issueName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new Ticktick());