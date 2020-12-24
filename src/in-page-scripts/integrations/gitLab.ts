class GitLab implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = [
        '*://*/issues/*',
        '*://*/merge_requests/*'
    ];

    match(source: Source): boolean {
        return !!$$('.detail-page-description .title');
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        linkElement.classList.add('btn');
        const header = $$('.detail-page-header');
        if (!header) {
            return;
        }

        // New design
        const issueButton = $$.visible('.js-issuable-actions', header);
        if (issueButton) {
            linkElement.classList.add('btn-grouped');
            issueButton.parentElement.insertBefore(linkElement, issueButton);
            return;
        }

        // Old design
        const buttons = $$('.issue-btn-group', header);
        if (buttons) {
            linkElement.classList.add('btn-grouped');
            buttons.appendChild(linkElement);
        } else {
            linkElement.style.marginLeft = '1em';
            header.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // https://gitlab.com/NAMESPACE/PROJECT/issues/NUMBER
        // https://gitlab.com/NAMESPACE/PROJECT/merge_requests/NUMBER
        const match = /^(.+)\/(issues|merge_requests)\/(\d+)$/.exec(source.path);

        if (!match) {
            return;
        }

        // match[3] is a 'NUMBER' from path
        let issueId = match[3];
        if (!issueId) {
            return;
        }

        const issueType = match[2];
        issueId = (issueType == 'merge_requests' ? '!' : '#') + issueId;

        const issueNameElement = $$.try('.detail-page-description .title');
        const issueName = issueNameElement.firstChild ? issueNameElement.firstChild.textContent : issueNameElement.textContent;
        if (!issueName) {
            return;
        }

        const projectNameNode = $$.findNode('.title .project-item-select-holder', Node.TEXT_NODE);

        const projectName = projectNameNode ?
            projectNameNode.textContent : // New design (both new and old navigation)
            ($$.try('.context-header .sidebar-context-title').textContent // Newest design
                || $$.try('.title > span > a:nth-last-child(2)').textContent); // Old design

        const serviceType = 'GitLab';

        let serviceUrl = ($$('a#logo') as HTMLAnchorElement).href;
        if (!serviceUrl || !source.fullUrl.startsWith(serviceUrl)) {
            serviceUrl = source.protocol + source.host;
        }

        const issueUrl = $$.getRelativeUrl(serviceUrl, source.fullUrl).match(/[^#]*/)[0]; // trim hash

        const tagNames = [
                '.issuable-show-labels .gl-label .gl-label-text',
                '.issuable-show-labels .gl-label',
                '.issuable-show-labels .badge',
                '.labels .label',
            ]
            .reduce((tags, selector) => tags.length ? tags : $$.all(selector), [] as HTMLElement[])
            .map(label => label.textContent);

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}

class GitLabSidebar implements WebToolIntegration {

    showIssueId = true;

    matchUrl = /(.*)\/boards/;

    observeMutations = true;

    get isSidebarOpen() {
        return !!$$.visible('.right-sidebar');
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (!this.isSidebarOpen) {
            return;
        }

        const div = document.createElement('div');
        linkElement.classList.add('btn', 'btn-default');
        div.appendChild(linkElement);
        $$('.issuable-sidebar-header .issuable-header-text').appendChild(div);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        if (!this.isSidebarOpen) {
            return;
        }

        const issueName = $$.try('.issuable-header-text > strong').textContent;
        const projectName = $$.try('.sidebar-context-title').textContent;
        const serviceType = 'GitLab';

        let serviceUrl = ($$('a#logo') as HTMLAnchorElement).href;
        if (!serviceUrl || !source.fullUrl.startsWith(serviceUrl)) {
            serviceUrl = source.protocol + source.host;
        }

        // #123, MyProject#123
        const issueFullId = $$.try('.issuable-header-text > span').textContent;
        let issueUrl: string;
        let issueId: string;
        let projectId: string;

        const idMatch = issueFullId && issueFullId.match(/\s*(.*)#(\d+)\s*/);
        if (idMatch) {

            projectId = idMatch[1];
            issueId = idMatch[2];

            // /MyGroup1/MyProject, /groups/MyGroup1/-
            issueUrl = $$.getRelativeUrl(serviceUrl, source.fullUrl.match(this.matchUrl)[1]);
            const groupIssueMatch = issueUrl.match(/\/groups\/(.+)\/-/);
            if (groupIssueMatch) {
                if (projectId) {
                    issueUrl = `/${groupIssueMatch[1]}/${projectId}`;
                } else {
                    issueId = null; // Unknown group url (TE-304)
                    issueUrl = null;
                }
            }

            if (issueId) {
                issueUrl += `/issues/${issueId}`;
                issueId = '#' + issueId;
            }
        }

        const tagNames = [
            '.issuable-show-labels .gl-label .gl-label-text',
            '.issuable-show-labels .gl-label',
            '.issuable-show-labels .badge',
            '.issuable-show-labels > a span',
        ]
            .reduce((tags, selector) => tags.length ? tags : $$.all(selector), [] as HTMLElement[])
            .map(label => label.textContent);

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new GitLab(), new GitLabSidebar());