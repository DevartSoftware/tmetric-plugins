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
        var issueName = $$.try('#summary-val').textContent;
        if (!issueName) {
            return;
        }

        var issueLink = $$('#key-val');
        if (issueLink) {
            var issueId = issueLink.getAttribute('data-issue-key');
            var issueHref = issueLink.getAttribute('href');
        }

        var projectName =
            $$.try('#project-name-val').textContent || // separate task view (/browse/... URL)
            $$.try('.project-title > a').textContent || // service desk
            $$.try('.sd-notify-header').textContent; // service desk form https://issues.apache.org/jira/servicedesk/agent/all

        var { serviceUrl, issueUrl } = this.getUrls(source, issueHref);

        var tagNames = $$.all('.labels .lozenge').map(label => label.textContent);

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

IntegrationService.register(new Jira(), new JiraAgile());