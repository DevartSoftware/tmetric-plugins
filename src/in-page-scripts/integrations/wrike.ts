class Wrike implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://*.wrike.com/workspace.htm*';

    issueElementSelector = '.wspace-task-view';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('.wrike-panel-header-toolbar', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-wrike');
            host.insertBefore(linkElement, host.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try<HTMLTextAreaElement>('textarea.title-field', issueElement).value;
        if (!issueName) {
            return;
        }

        let issueTags = $$.all('.wspace-task-widgets-tags-dataview > div', issueElement);
        let projectName = issueTags.length == 1 ? issueTags[0].textContent : null;

        let params = $$.searchParams(document.location.hash);

        let issueId = params['t']                 // folder, My Work,
            || params['ot'];                      // modal

        let inboxMatch = document.location.hash && document.location.hash.match(/#\/inbox\/task\/(\d+)/);
        if (inboxMatch) {
            issueId = inboxMatch[1];
        }

        // get issue id from task in dashboard widgets
        let isOverview = params['path'] == 'overview';
        if (!issueId && isOverview) {

            // find issue identifier by name
            let foundIdentifiers = $$.all('wrike-task-list-task')
                .map(task => {
                    if ($$('.task-block wrike-task-title', task).textContent == issueName) {
                        return task.getAttribute('data-id');
                    }
                })
                .filter(_ => !!_);

            if (foundIdentifiers.length == 1) {
                issueId = foundIdentifiers[0];
            }
        }

        let issueUrl: string;
        if (issueId) {
            issueUrl = '/open.htm?id=' + issueId;
            issueId = '#' + issueId;
        }

        let serviceType = 'Wrike';

        let serviceUrl = source.protocol + source.host;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Wrike());