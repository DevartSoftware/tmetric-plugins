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

            // find first task with matched issue and project name
            // or just matched issue name
            let taskInfo = $$.all('wrike-task-list-task')
                // get task infos
                .reduce((props, task) => {

                    // skip task without id
                    let id = task.getAttribute('data-id');
                    if (!id) {
                        return props;
                    }

                    // task element include task and subtasks
                    // narrow to task
                    let taskEl = $$('.task-block', task);

                    // skip task with not matched name
                    if ($$('wrike-task-title', taskEl).textContent != issueName) {
                        return props;
                    }

                    // get project tags
                    let tags = $$.all('.tag-text', taskEl);

                    // skip if project tags more than 1
                    if (tags.length > 1) {
                        return props;
                    }

                    if (tags.length == 0) {
                        // task from dashboard widget location root does not display project tag
                        // include task without tag
                        props.push({ id, projectMatch: false });
                    } else if (tags[0].textContent == projectName) {
                        // include task with matched project name
                        props.push({ id, projectMatch: true });
                    }

                    return props;
                }, <{ id: string, projectMatch: boolean }[]>[])
                // prioritize tasks with matched project name
                .sort((a, b) => (a.projectMatch ? 0 : 1) - (b.projectMatch ? 0 : 1))[0];

            if (taskInfo) {
                issueId = taskInfo.id;
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