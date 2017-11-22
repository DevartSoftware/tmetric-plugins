class DoitIm implements WebToolIntegration {

    showIssueId = false;

    matchUrl: RegExp;

    constructor(private _issueType: string, private _titleSelector: string) {

        // https://i.doit.im/home/#/task/99999999-aaaa-bbbb-cccc-dddddddddddd
        // https://i.doit.im/home/#/project/99999999-aaaa-bbbb-cccc-dddddddddddd
        // https://i.doit.im/home/#/goal/99999999-aaaa-bbbb-cccc-dddddddddddd
        this.matchUrl = new RegExp(`(https://i.doit.im)(/home/#/${_issueType}/([a-z0-9\-]+))`);
    }

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let toolbar = $$(`li.${this._issueType}-op`, issueElement);
        if (toolbar) {
            linkElement.classList.add('btn-4');
            toolbar.insertBefore(linkElement, toolbar.firstChild);
        }

    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try(`${this._titleSelector} span.title`).textContent;

        let matches = source.fullUrl.match(this.matchUrl);
        let serviceUrl = matches[1];
        let issueUrl = matches[2];
        let issueId = matches[3];
        let projectName: string;

        // if task have no goal or project then items with selectors below will be available, but hidden
        // and all of them will contain #false, @false or ''
        if (
            $$.all('.task-attr .goal, .task-attr .context, .task-attr .project')
                .every(_ => ['#false', '@false'].indexOf(_.textContent) >= 0 || _.textContent == '')
        ) {
            projectName = '';
        } else {
            projectName = $$.try('.task-attr .goal').textContent ||
                // returning textContent or '' below because of sometimes textContent is undefined
                ($$.try('.task-attr .project').textContent || '').substring(1); // using substring because project name contains '#' as first letter
        }

        return { issueId, issueName, issueUrl, serviceUrl, projectName, serviceType: 'Doit.im' };
    }
}

IntegrationService.register(
    new DoitIm('task', '#task_container'),
    new DoitIm('project', '#project_info'),
    new DoitIm('goal', '#goal_info'));