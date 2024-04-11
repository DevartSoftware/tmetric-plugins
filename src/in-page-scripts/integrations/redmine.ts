class Redmine implements WebToolIntegration {

    showIssueId = true;

    observeMutations = false;

    matchUrl = '*://*/issues/*';

    issueElementSelector = 'body.controller-issues.action-show';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('#content .contextual');
        if (host) {
            host.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const issuesPath = '/issues/';

        // http://rm.devart.local/redmine/issues/58480
        // PROTOCOL = http://
        // HOST = rm.devart.local
        // PATH = /redmine/issues/58480
        let i = source.path.lastIndexOf(issuesPath);
        const path = source.path.substring(0, i); // /redmine
        const serviceUrl = source.protocol + source.host + path; // http://rm.devart.local/redmine

        // path = /redmine/issues/58480
        const issueIdMatch = /\d+/.exec(source.path.substring(i + issuesPath.length));
        if (!issueIdMatch) {
            return;
        }
        let issueId = issueIdMatch[0];
        const issueUrl = issuesPath + issueId;
        issueId = '#' + issueId;

        // <div class="subject" >
        // <div><h3>The title of the issue</h3></div>
        const issueName = $$.try('.subject h3').textContent;
        if (!issueName) {
            return;
        }

        // <h1><a class="root" href="PATH/projects/almteam?jump=issues">ALM</a> » Time Tracker</h1>
        let projectName = $$.try('h1').textContent;
        if (projectName) {
            i = projectName.lastIndexOf('»');
            if (i >= 0) {
                projectName = projectName.substring(i + 1);
            }
        }

        const serviceType = 'Redmine';

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Redmine());