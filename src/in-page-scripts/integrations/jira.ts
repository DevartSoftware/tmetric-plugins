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

class Jira extends JiraBase implements WebToolIntegration {

    issueElementSelector = () => [
        $$.visible([
            '#ghx-detail-view', // Issue sidebar
            '[role=dialog]', // Issue dialog
            '#jira-frontend > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2)', // Issues and filters
            '#issue-content .issue-header-content' // Issues and filters
        ].join(','))
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('.command-bar .aui-toolbar2-primary');
        if (host) {
            linkElement.classList.add('aui-button');
            host.appendChild(linkElement);
            return;
        }

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

        let issueName = $$.try('h1', issueElement);
        if (!issueName) {
            return;
        }

        host = $$.closest('*', issueName.parentElement, el => {
            let style = window.getComputedStyle(el);
            let display = style.getPropertyValue('display');
            return display.indexOf('flex') < 0;
        });

        if (host) {
            linkElement.classList.add('devart-timer-link-jira-next');
            host.appendChild(linkElement);
            return;
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('h1', issueElement).textContent;
        if (!issueName) {
            return;
        }

        let anchors = $$.all('a', issueElement);

        let issueLinks = anchors.filter(el => el.getAttribute('href').split('/').some(v => v == 'browse'));
        if (!issueLinks.length) {
            return;
        }

        let selectedIssue = $$.searchParams(source.path)["selectedIssue"];
        let issueLink = issueLinks.find(el => el.getAttribute('href').endsWith(selectedIssue)) || issueLinks[issueLinks.length - 1];
        let issueHref = issueLink.getAttribute('href');
        let issueId = issueHref.split('/').pop();
        let { serviceUrl, issueUrl } = this.getUrls(source, issueHref);

        let projectName = $$.try('#breadcrumbs-container a', null, el => el.getAttribute('href').split('/').some(v => v == 'projects')).textContent
            || $$.try('.project-title > a').textContent
            || $$.try('#project-name-val').textContent // separate task view (/browse/... URL)
            || $$.try('.project-title > a').textContent // service desk
            || $$.try('#navigation-app div[role=presentation] button:nth-child(1) div:nth-child(2) div:nth-child(1)').textContent // full task view
            || $$.try('.sd-notify-header').textContent; // service desk form https://issues.apache.org/jira/servicedesk/agent/all

        let tagNames = anchors.filter(el => !!($$.searchParams(el.getAttribute('href'))['jql'] || '').startsWith('labels')).map(el => el.textContent);
        if (!tagNames.length) {
            tagNames = $$.all('.labels .lozenge').map(label => label.textContent);
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira', tagNames };
    }
}

IntegrationService.register(new Jira(), new JiraAgile());