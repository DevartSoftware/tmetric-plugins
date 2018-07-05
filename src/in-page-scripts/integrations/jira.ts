class JiraBase {

    showIssueId = true;

    observeMutations = true;

    match(source: Source): boolean {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'JIRA';
    }

    getUrls(source: Source, issueHref: string) {

        var serviceUrl = source.protocol + source.host;
        var issueUrl = issueHref;

        // for case when jira installed outside domain root we should append context path to serviceUrl and remove it from issueUrl
        // https://issues.apache.org/jira/
        // ajs-context-path = /jira
        // serviceUrl = http://jira.local
        // issueUrl = /jira/browse/tt-1
        var jiraContextPath = $$.getAttribute('meta[name=ajs-context-path]', 'content');
        if (jiraContextPath) {
            serviceUrl += jiraContextPath;
            issueUrl = $$.getRelativeUrl(jiraContextPath, issueUrl);
        }

        return { serviceUrl, issueUrl };
    }

    getProjectNameFromProjectSelector() {
        // Find avatar element
        let avatarElement = $$('#navigation-app span[role="img"]', null, el => (el.style.backgroundImage || '').indexOf('projectavatar') >= 0);

        // Find avatar container
        let avatarContainer = avatarElement && $$.closest('span', avatarElement, el => !!el.nextElementSibling);

        // Find text node in avatar container sibling
        let projectNode = avatarContainer && $$.findNode('span', Node.TEXT_NODE, avatarContainer.nextElementSibling);
        let projectName = projectNode && projectNode.textContent;

        return projectName;
    }
}

class Jira extends JiraBase implements WebToolIntegration {

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.command-bar .toolbar-split');
        if (host) {
            linkElement.classList.add('toolbar-trigger');

            // <ul class="toolbar-group">
            var containerUl = $$.create('ul', 'toolbar-group');

            // <li class="toolbar-item">
            var containerLi = $$.create('li', 'toolbar-item');

            containerLi.appendChild(linkElement);

            containerUl.appendChild(containerLi);
            host.appendChild(containerUl);
        }
    }

    /* This code is suitable for both Jira and Jira Service Desk */
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Detect Agile Desk
        if ($$('#ghx-rabid #ghx-detail-issue')) {
            return;
        }

        // https://devart.atlassian.net/browse/TT-1
        // PROTOCOL = http://
        // HOST = devart.atlassian.net
        // PATH = /browse/TT-1
        let issueName = $$.try('#summary-val').textContent;
        if (!issueName) {
            return;
        }

        let issueLink = $$('#key-val');
        if (issueLink) {
            var issueId = issueLink.getAttribute('data-issue-key');
            var issueHref = issueLink.getAttribute('href');
        }

        let projectName =
            $$.try('#project-name-val').textContent || // separate task view (/browse/... URL)
            $$.try('.project-title > a').textContent || // service desk
            $$.try('.sd-notify-header').textContent || // service desk form https://issues.apache.org/jira/servicedesk/agent/all
            $$.try('#navigation-app span[role="menuitem"] > span:nth-child(2) > span > span').textContent // for new design separate task view (/browse/... URL);

        if (!projectName) { // separate task view with side bar (TE-206)
            projectName = this.getProjectNameFromProjectSelector();
        }

        let { serviceUrl, issueUrl } = this.getUrls(source, issueHref);

        let tagNames = $$.all('.labels .lozenge').map(label => label.textContent);

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira', tagNames };
    }
}

class JiraAgile extends JiraBase implements WebToolIntegration {

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var detailSection = $$('#ghx-detail-head');
        if (detailSection) {
            var container = $$.create('div');
            container.appendChild(linkElement);

            detailSection.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        // seek specific element for Agile Desk and check if detail view is visible
        if (!$$('#ghx-rabid #ghx-detail-issue')) {
            return;
        }

        var issueName = $$.try('dd[data-field-id=summary]').textContent;
        if (!issueName) {
            // nothing to do without issue name
            return;
        }

        var propertyLink = $$('dd[data-field-id=issuekey]');

        var issueId = propertyLink.textContent;

        var issueHref = $$.getAttribute('a', 'href', propertyLink);

        var projectName = $$('.ghx-project').textContent;

        var { serviceUrl, issueUrl } = this.getUrls(source, issueHref);

        var tagNames = $$.all('.labels .lozenge').map(label => label.textContent);

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira', tagNames };
    }
}

class JiraNext extends JiraBase implements WebToolIntegration {

    issueElementSelector = () => [
        $$.visible('#ghx-detail-view'), // Issue sidebar
        $$.visible('[role=dialog]'), // Issue dialog
        $$.visible('#jira-frontend') // Issues and filters
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let anchor = $$('object ~ div a', issueElement);
        if (!anchor) {
            return;
        }

        let host = anchor.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
        host.appendChild(linkElement);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('object ~ div h1', issueElement).textContent;
        if (!issueName) {
            return;
        }

        let anchors = $$.all('object ~ div a', issueElement);

        let issueLinks = anchors.filter(el => el.getAttribute('href').split('/').some(v => v == 'browse'));
        if (!issueLinks.length) {
            return;
        }

        let selectedIssue = $$.searchParams(source.path)["selectedIssue"];
        let issueLink = issueLinks.find(el => el.getAttribute('href').endsWith(selectedIssue)) || issueLinks[0];
        let issueHref = issueLink.getAttribute('href');
        let issueId = issueHref.split('/').pop();
        let { serviceUrl, issueUrl } = this.getUrls(source, issueHref);

        let projectName = $$.try('#content a', null, el => el.getAttribute('href').split('/').some(v => v == 'projects')).textContent;
        if (!projectName) {
            projectName = this.getProjectNameFromProjectSelector();
            // Project name can not be parsed with collapsed navigation bar
            if (!projectName) {
                return;
            }
        }

        let tagNames = anchors.filter(el => !!($$.searchParams(el.getAttribute('href').split('?')[1])['jql'] || '').startsWith('labels')).map(el => el.textContent);

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira', tagNames };
    }
}

IntegrationService.register(new Jira(), new JiraAgile(), new JiraNext());