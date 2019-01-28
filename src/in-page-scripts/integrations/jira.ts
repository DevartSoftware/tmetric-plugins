class Jira implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    match(source: Source): boolean {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'JIRA';
    }

    issueElementSelector = () => [
        $$.visible([
            '#ghx-detail-view', // Issue sidebar
            '[role=dialog]', // Issue dialog
            '#issue-content', // Old issues and filters
            '.new-issue-container' // Issue
        ].join(',')),
        // Issues and filters
        ((obj: HTMLElement) => obj ? obj.parentElement.parentElement.parentElement : null)($$('#jira-frontend object'))
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // Old filters and issues
        let host = $$('.command-bar .aui-toolbar2-primary', issueElement);
        if (host) {
            linkElement.classList.add('aui-button');
            host.appendChild(linkElement);
            return;
        }

        // Old separate issue page
        host = $$('.command-bar .toolbar-split-left', issueElement);
        if (host) {
            let ul = $$.create('ul', 'toolbar-group');
            let li = $$.create('li', 'toolbar-item');
            linkElement.classList.add('toolbar-trigger');
            li.appendChild(linkElement);
            ul.appendChild(li);
            host.appendChild(ul);
            return;
        }

        // Old agile sidebar
        host = $$('#ghx-detail-head', issueElement);
        if (host) {
            let container = $$.create('div');
            container.appendChild(linkElement);
            host.appendChild(container);
            return;
        }

        // New view
        let issueName = $$('h1', issueElement);
        if (!issueName) {
            return;
        }

        let anchor = $$('a[href^="/browse/"][target=_blank]', issueElement);
        if (anchor) {
            linkElement.classList.add('devart-timer-link-jira-next');
            if (issueElement.matches('#ghx-detail-view')) {
                linkElement.classList.add('devart-timer-link-minimal');
            }
            anchor.parentElement.appendChild(linkElement);
            return;
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('dd[data-field-id=summary], h1', issueElement).textContent;
        if (!issueName) {
            return;
        }

        // In case when JIRA installed outside domain root we
        // should append path to serviceUrl.
        // Example: https://issues.apache.org/jira/
        let servicePath = $$.getAttribute('meta[name=ajs-context-path]', 'content');
        let serviceUrl = source.protocol + source.host + servicePath;

        let issueId = $$.searchParams(source.fullUrl)['selectedIssue'] // Board
            || (source.path.match(/\/(?:issues|browse)\/([^\/]+)/) || [])[1]; // Other pages
        let issueUrl = issueId && ('/browse/' + issueId);

        let projectName = $$.try('#breadcrumbs-container a', null, el => el.getAttribute('href').split('/').some(v => v == 'projects')).textContent // when navigation bar collapsed
            || $$.try('#project-name-val').textContent // separate task view (/browse/... URL)
            || $$.try('.project-title > a').textContent // old service desk and agile board
            || $$.try('.sd-notify-header').textContent // service desk form https://issues.apache.org/jira/servicedesk/agent/all
            || $$.try('img', issueElement, (img: HTMLImageElement) => /projectavatar/.test(img.src)).title // issues and filter
            || this.getProjectNameFromNavigationBar(); // navigation bar expanded, trying to find project name by project avatar

        let tagNames = $$.all('a', issueElement)
            .filter(el => /jql=labels/.test(el.getAttribute('href')))
            .map(el => el.textContent);
        if (!tagNames.length) {
            tagNames = ($$.try('dd[data-field-id=labels]', issueElement).textContent || '').split(','); // old interface
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira', tagNames };
    }

    private getProjectNameFromNavigationBar() {
        // Find avatar element
        let avatarElement = $$('#navigation-app span[role="img"], [data-test-id="navigation-apps.project-switcher-v2"] span[role="img"]', null, el => (el.style.backgroundImage || '').indexOf('projectavatar') >= 0);

        // Find avatar container
        let avatarContainer = avatarElement && $$.closest('div,span', avatarElement, el => !!el.innerText);

        // Find text node in avatar container
        let projectNode = avatarContainer && $$.try('div,span', avatarContainer, el => el.textContent && !el.childElementCount);
        if (projectNode && projectNode.offsetWidth) {
            return projectNode.textContent;
        }
    }
}

IntegrationService.register(new Jira());