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
        let header = $$('.detail-page-header');
        if (!header) {
            return;
        }

        // New design
        let issueButton = $$.visible('.js-issuable-actions', header);
        if (issueButton) {
            linkElement.classList.add('btn-grouped');
            issueButton.parentElement.insertBefore(linkElement, issueButton);
            return;
        }

        // Old design
        let buttons = $$('.issue-btn-group', header);
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
        let match = /^(.+)\/(issues|merge_requests)\/(\d+)$/.exec(source.path);

        if (!match) {
            return;
        }

        // match[3] is a 'NUMBER' from path
        let issueId = match[3];
        if (!issueId) {
            return;
        }

        let issueType = match[2];
        issueId = (issueType == 'merge_requests' ? '!' : '#') + issueId;

        let issueNameElement = $$.try('.detail-page-description .title');
        let issueName = issueNameElement.firstChild ? issueNameElement.firstChild.textContent : issueNameElement.textContent;
        if (!issueName) {
            return;
        }

        let projectNameNode = $$.findNode('.title .project-item-select-holder', Node.TEXT_NODE);

        let projectName = projectNameNode ?
            projectNameNode.textContent : // New design (both new and old navigation)
            ($$.try('.context-header .sidebar-context-title').textContent // Newest design
                || $$.try('.title > span > a:nth-last-child(2)').textContent); // Old design

        let serviceType = 'GitLab';

        let serviceUrl = (<HTMLAnchorElement>$$('a#logo')).href;
        if (!serviceUrl || !source.fullUrl.startsWith(serviceUrl)) {
            serviceUrl = source.protocol + source.host;
        }

        let issueUrl = $$.getRelativeUrl(serviceUrl, source.fullUrl);

        var tagNames = $$.all('.labels .label, .issuable-show-labels .badge').map(label => label.textContent);

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

        let div = document.createElement('div');
        linkElement.classList.add('btn', 'btn-default');
        div.appendChild(linkElement);
        $$('.issuable-sidebar-header .issuable-header-text').appendChild(div);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        if (!this.isSidebarOpen) {
            return;
        }

        let issueName = $$.try('.issuable-header-text > strong').textContent;
        let projectName = $$.try('.sidebar-context-title').textContent;
        let serviceType = 'GitLab';

        let serviceUrl = (<HTMLAnchorElement>$$('a#logo')).href;
        if (!serviceUrl || !source.fullUrl.startsWith(serviceUrl)) {
            serviceUrl = source.protocol + source.host;
        }

        // #123, MyProject#123
        let issueFullId = $$.try('.issuable-header-text > span').textContent;
        let issueUrl: string;
        let issueId: string;
        let projectId: string;

        let idMatch = issueFullId && issueFullId.match(/\s*(.*)#(\d+)\s*/);
        if (idMatch) {

            projectId = idMatch[1];
            issueId = idMatch[2];

            // /MyGroup1/MyProject, /groups/MyGroup1/-
            issueUrl = $$.getRelativeUrl(serviceUrl, source.fullUrl.match(this.matchUrl)[1]);
            let groupIssueMatch = issueUrl.match(/\/groups\/(.+)\/-/);
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

        let tagNames = $$.all('.issuable-show-labels > a span, .issuable-show-labels .badge').map(label => label.textContent);

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new GitLab(), new GitLabSidebar());