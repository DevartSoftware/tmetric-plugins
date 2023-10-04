class Wrike implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://*.wrike.com/workspace.htm*';

    issueElementSelector = [
        'wrike-task-list-task',    // new design dashboard
        '.work-item-view__header', // new design task modal
        '.wspace-task-view',       // old design
        '.task-view'             // old design
    ]

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) {
            const host = $$('wrike-task-title', issueElement).parentElement.lastElementChild.firstElementChild;
            if (host) {
                linkElement.classList.add('devart-timer-link-wrike');
                host.insertBefore(linkElement, host.lastElementChild.nextSibling);
            }
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            const host = $$('.work-item-header__action-panel', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-wrike');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        } else if (issueElement.matches(this.issueElementSelector[2]) || issueElement.matches(this.issueElementSelector[3])) {
            const host = $$('.task-view-header__actions', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-wrike');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        const issueNameElement = $$.try('wrike-task-title, work-item-title', issueElement); // new design 
        const issueName = $$.try<HTMLTextAreaElement>('textarea.title-field, textarea.title__field', issueElement).value || issueNameElement.textContent;
        if (!issueName) {
            return;
        }
        const issueTags = $$.all('.wspace-task-widgets-tags-dataview > div, .task-tags .tag-text', issueElement);
        let projectName = issueTags.length == 1 ? issueTags[0].textContent : null;

        if (!projectName) {
            const projectTags = $$.all('wrike-task-parent-folders, wrike-folder-tag-label', issueElement); // new design 
            projectName = projectTags.length == 1 ? projectTags[0].textContent : null;
        }
        const params = $$.searchParams(document.location.hash);

        let issueId = params['t']                 // folder, My Work,
            || params['ot'];                      // modal

        const inboxMatch = document.location.hash && document.location.hash.match(/#\/inbox\/task\/(\d+)/);
        if (inboxMatch) {
            issueId = inboxMatch[1];
        }

        // get issue id from task in dashboard widgets
        const isOverview = params['path'] == 'overview';
        if (!issueId && isOverview) {

            // find issue identifier by name
            const foundIdentifiers = $$.all('wrike-task-list-task')
                .map(task => {
                    if ($$('.task-block wrike-task-title', task).textContent == issueName) {
                        return task.getAttribute('data-id');
                    }
                })
                .filter((item, index, array) =>
                    !!item && // filter out tasks without id
                    array.indexOf(item) == index // filter out task dulicates
                );

            if (foundIdentifiers.length == 1) {
                issueId = foundIdentifiers[0];
            }
        }
        if (!issueId) {
            issueId = issueElement.getAttribute('data-id'); // new design 
        }
        if (!issueId) {
            const params = new URLSearchParams(document.location.hash.split('?')[1]); // new design 
            issueId = params.get('overlayEntityId') || params.get('sidePanelItemId');
        }

        let issueUrl: string;
        if (issueId) {
            issueUrl = '/open.htm?id=' + issueId;
            issueId = '#' + issueId;
        }

        const serviceType = 'Wrike';

        const serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Wrike());