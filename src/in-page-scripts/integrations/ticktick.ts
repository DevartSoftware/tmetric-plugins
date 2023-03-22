class Ticktick implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://ticktick.com/*';

    issueElementSelector = [
        '.task',
        '#task-detail-inner'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const container = $$.create('span');
        container.classList.add('devart-timer-tick-tick');
        container.appendChild(linkElement);
        if (issueElement.matches(this.issueElementSelector[0])) {

            var blockToAdd = $$('.title', issueElement);

            var element = $$('.task-inner', issueElement);
            element.classList.add('devart-timer-tick-tick-overflow');
            element.querySelectorAll('div').forEach((x) => {
                x.classList.add('devart-timer-tick-tick-overflow');
            })
            blockToAdd.appendChild(container);
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            var blockToAdd = $$('.timecard-wrap', issueElement);
            blockToAdd.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueNameElement =
            $$.try('.CodeMirror-code span', issueElement).textContent
                ? $$.try('.CodeMirror-code span', issueElement)
                : $$.try('.title > span', issueElement).textContent
                    ? $$.try('.title > span', issueElement)
                    : null;
        if (!issueNameElement) {
            return;
        }
        const isGrayed = [...issueNameElement.classList].some(x => /text-gr[ae]y-[1-5]0/.test(x));
        const issueName = isGrayed ? "" : issueNameElement.textContent
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
            let match = /(tasks|kanban|quadrant(\d+))\/(\w+)/.exec(url);
            if (match) {
                issueId = '#' + match[match.length-1];
                issueUrl = '/' + parsedUrl.hash;
            }
        }

        let tagNames = $$.all('.tag-list a', issueElement).map(_ => _.textContent);

        const serviceType = 'TickTick';

        const serviceUrl = source.protocol + source.host;

        return { issueId, issueName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new Ticktick());