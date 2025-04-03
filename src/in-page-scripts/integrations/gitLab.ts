class GitLab implements WebToolIntegration {

    showIssueId = true;

    matchUrl = [
        '*://*/issues/*',
        '*://*/issues?show=*',
        '*://*/merge_requests/*'
    ];

    titleSelector = '.detail-page-description .title, .merge-request .detail-page-header .title, .work-item-view [data-testid="work-item-title"]';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        linkElement.classList.add('btn');
        linkElement.style.margin = 'auto'
        const header = $$('.detail-page-header');

        if (header) {
            // Merge request
            const actionsGroup = $$.visible('.js-issuable-actions');
            if (actionsGroup) {
                linkElement.style.marginRight = '8px';
                actionsGroup.insertBefore(linkElement, actionsGroup.firstChild);
                return;
            }

            // New design
            const issueButton = $$.visible('.js-issuable-edit', header);
            if (issueButton) {
                linkElement.classList.add('btn-grouped');
                issueButton.parentElement!.insertBefore(linkElement, issueButton);
                return;
            }

            // Old design
            const buttons = $$('.issue-btn-group', header);
            if (buttons) {
                linkElement.classList.add('btn-grouped');
                buttons.appendChild(linkElement);
                return;
            }

            linkElement.style.marginLeft = '1em';
            header.appendChild(linkElement);
        } else {
            // new design without header (sign in user)
            const btnGroup = $$('[data-testid="work-item-actions-dropdown"]')?.parentElement?.parentElement;
            if (!btnGroup) {
                return;
            }

            btnGroup.insertBefore(linkElement, btnGroup.firstChild);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {
        if (!$$('.detail-page-description, .merge-request, .work-item-view')) {
            return;
        }

        // https://gitlab.com/NAMESPACE/PROJECT/issues/NUMBER
        // https://gitlab.com/NAMESPACE/PROJECT/issues/incident/NUMBER
        // https://gitlab.com/NAMESPACE/PROJECT/merge_requests/NUMBER
        const regExp = /^(.+)\/(issues|issues\/incident|merge_requests)\/(\d+)$/;
        let match = regExp.exec(source.path);
        let issueLink;
        // if match is null then a design is new and
        // the url is https://gitlab.com/TestQAQC/project-with-issues-in-tmetric/-/issues?show=eyJpaWQiOiI1IiwiZn...
        // try to find item ref link
        if (!match) {
            issueLink = $$<HTMLAnchorElement>('a[data-testid="work-item-drawer-ref-link"]', _issueElement)?.href;
            if (issueLink != null) {
                match = regExp.exec(issueLink);
            }
        }

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

        const issueNameElement = $$.try(this.titleSelector);
        const issueName = issueNameElement.firstChild ? issueNameElement.firstChild.textContent : issueNameElement.textContent;
        if (!issueName) {
            return;
        }

        const serviceType = 'GitLab';

        let serviceUrl = $$<HTMLAnchorElement>('a#logo, a.tanuki-logo-container')?.href;
        if (!serviceUrl || !source.fullUrl.startsWith(serviceUrl)) {
            serviceUrl = source.protocol + source.host;
        }

        let issueUrl = $$.getRelativeUrl(serviceUrl, issueLink ? issueLink : source.fullUrl).match(/[^#]*/)?.[0]; // trim hash
        if (issueType == 'issues/incident') {
            issueUrl = issueUrl?.replace('/incident', '');
        }

        const projectNameNode = $$.findNode('.title .project-item-select-holder', Node.TEXT_NODE);
        const projectName = projectNameNode?.textContent // New design (both new and old navigation)
            || $$('.context-header .sidebar-context-title')?.textContent // Newest design
            || $$('.title > span > a:nth-last-child(2)')?.textContent // Old design
            || GitLab.getProjectFromBreadcrumbs(serviceUrl, issueUrl);

        let tagNames = $$.all('.issuable-show-labels .gl-label[data-qa-label-name]').map(el => el.getAttribute('data-qa-label-name'));
        if (!tagNames.length) {
            tagNames = [
                '.issuable-show-labels .gl-label .gl-label-text',
                '.issuable-show-labels .gl-label',
                '.issuable-show-labels .badge',
                '.labels .label',
                '.work-item-attributes-item .gl-label'
            ]
                .reduce((tags, selector) => tags.length ? tags : $$.all(selector), [] as HTMLElement[])
                .map(label => label.textContent);
        }

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }

    static getProjectFromBreadcrumbs(serviceUrl: string, issueUrl: string | undefined) {
        if (issueUrl && issueUrl.indexOf('/-/')! >= 0) {
            const projectUrl = serviceUrl.replace(/\/$/, '') + issueUrl.substring(0, issueUrl.indexOf('/-/'));
            return $$<HTMLAnchorElement>('.breadcrumbs-list a', null, a => a.href == projectUrl)?.innerText // Old design
                || $$<HTMLAnchorElement>('.breadcrumb a', null, a => a.href == projectUrl)?.innerText; // Newest design
        }
    }
}

class GitLabSidebar implements WebToolIntegration {

    showIssueId = true;

    matchUrl = /(.*)\/boards/;

    issueElementSelector = [
        '.right-sidebar', // old sidebar
        '.gl-drawer-sidebar', // new sidebar
        '.work-item-view' // board with show issue (new version 2025)
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[2])) { // board with show issue (new version 2025)
            const btnGroup = $$('[data-testid="work-item-actions-dropdown"]')?.parentElement?.parentElement;
            if (!btnGroup) {
                return;
            }

            linkElement.classList.add('btn');
            linkElement.style.margin = 'auto';

            btnGroup.insertBefore(linkElement, btnGroup.firstChild);

        } else {
            const isOldSidebar = issueElement.matches(this.issueElementSelector[0]);

            if (!$$.visible(this.issueElementSelector[isOldSidebar ? 0 : 1])) {
                return;
            }

            const div = document.createElement('div');
            linkElement.classList.add('btn', 'btn-default');
            div.appendChild(linkElement);

            if (isOldSidebar) {
                $$('.issuable-sidebar-header .issuable-header-text', issueElement)?.appendChild(div);
            } else {
                div.classList.add('devart-timer-link-gitlab-container');
                $$('header', issueElement)?.parentElement!.appendChild(div);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        if (issueElement.matches(this.issueElementSelector[2])) { // board with show issue (new version 2025)
            if (!$$.visible(this.issueElementSelector[2])) {
                return;
            }

            let issueLink = $$<HTMLAnchorElement>('a[data-testid="work-item-drawer-ref-link"]')?.href;
            let issueId;
            if (issueLink != null) {
                const match = /^(.*)\/(\d+)$/.exec(issueLink);
                if (!match) {
                    return;
                }

                // match[3] is a 'NUMBER' from path
                issueId = `#${match[2]}`;
            }

            if (!issueId) {
                return;
            }

            const issueName = $$('[data-testid="work-item-title"]', issueElement)?.textContent;
            if (!issueName) {
                return;
            }

            const serviceType = 'GitLab';

            let serviceUrl = $$<HTMLAnchorElement>('a#logo, a.tanuki-logo-container')?.href;
            if (!serviceUrl || !source.fullUrl.startsWith(serviceUrl)) {
                serviceUrl = source.protocol + source.host;
            }

            const issueUrl = $$.getRelativeUrl(serviceUrl, issueLink ? issueLink : source.fullUrl); //.match(/[^#]*/)?.[0]; // trim hash

            const projectName = GitLab.getProjectFromBreadcrumbs(serviceUrl, issueUrl);

            const tagNames = $$.all('.work-item-attributes-item .gl-label')
                .map(label => label.textContent);

            return {
                issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
            } as WebToolIssue;

        } else {
            const isOldSidebar = issueElement.matches(this.issueElementSelector[0]);

            if (!$$.visible(this.issueElementSelector[isOldSidebar ? 0 : 1])) {
                return;
            }

            // Joining selectors from old and new sidebar with comma is problematic because layout with new sidebar contain also empty old sidebar.
            const issueName = $$(isOldSidebar ? '.issuable-header-text > strong' : 'header > span', issueElement)?.textContent;
            const serviceType = 'GitLab';

            let serviceUrl = $$<HTMLAnchorElement>('a#logo, a.tanuki-logo-container')?.href;
            if (!serviceUrl || !source.fullUrl.startsWith(serviceUrl)) {
                serviceUrl = source.protocol + source.host;
            }

            // #123, MyProject#123
            const issueFullId = $$(isOldSidebar ? '.issuable-header-text > span' : 'header ~ div', issueElement)?.textContent;
            let issueUrl: string | undefined;
            let issueId: string | undefined;

            const idMatch = issueFullId && issueFullId.match(/\s*(.*)#(\d+)\s*/);
            if (idMatch) {

                const projectId = idMatch[1];
                issueId = idMatch[2];

                // /MyGroup1/MyProject, /groups/MyGroup1/-
                issueUrl = $$.getRelativeUrl(serviceUrl, source.fullUrl.match(this.matchUrl)![1]);
                const groupIssueMatch = issueUrl.match(/\/groups\/(.+)\/-/);
                if (groupIssueMatch) {
                    if (projectId) {
                        issueUrl = `/${groupIssueMatch[1]}/${projectId}`;
                    } else {
                        issueId = undefined; // Unknown group url (TE-304)
                        issueUrl = undefined;
                    }
                }

                if (issueId) {
                    issueUrl += `/issues/${issueId}`;
                    issueId = '#' + issueId;
                }
            }

            const projectName = $$('.sidebar-context-title')?.textContent
                || GitLab.getProjectFromBreadcrumbs(serviceUrl, issueUrl);

            let tagNames = $$.all('.gl-label-text', issueElement).map(label => {
                const scopedLabel = $$.next('.gl-label-text-scoped', label);
                const segments = [label.textContent, scopedLabel?.textContent]
                    .map(text => text?.trim() || '')
                    .filter(text => text);
                return segments.join('::')
            });

            if (!tagNames.length) {
                tagNames = [
                    '.issuable-show-labels .gl-label .gl-label-text',
                    '.issuable-show-labels .gl-label',
                    '.issuable-show-labels .badge',
                    '.issuable-show-labels > a span',
                ]
                    .reduce((tags, selector) => tags.length ? tags : $$.all(selector), [] as HTMLElement[])
                    .map(label => label.textContent!)
                    .filter(text => text);
            }

            return {
                issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
            } as WebToolIssue;
        }
    }
}

IntegrationService.register(new GitLab(), new GitLabSidebar());