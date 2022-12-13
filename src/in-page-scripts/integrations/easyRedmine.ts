class EasyRedmine implements WebToolIntegration {

    showIssueId = true;

    observeMutations = false;

    matchUrl = /(.*)\/(issues|easy_crm_cases|test_cases)\/(\d+)/;

    match(source: Source): boolean {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'Easy Redmine';
    }

    issueElementSelector = [
        'body.controller-issues.action-show',
        'body.controller-easy_crm_cases.action-show',
        'body.controller-test_cases.action-show'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var title = $$('#content h2', issueElement);
        if (title) {
            linkElement.classList.add('devart-timer-link-easy-redmine');
            title.parentElement.insertBefore(linkElement, title.nextElementSibling);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Cloud instance:
        // https://ACCOUNT_ID.easyredmine.com/issues/ISSUE_ID
        // serviceUrl = https://ACCOUNT_ID.easyredmine.com

        // Server instance:
        // http://COMPANY_HOST/redmine/issues/ISSUE_ID
        // serviceUrl = https://COMPANY_HOST/redmine

        var match = this.matchUrl.exec(source.fullUrl);
        if (!match) {
            return;
        }
        var serviceUrl = match[1];
        var issueUrl = match[2] + '/' + match[3];
        var issueId = '#' + match[3];

        var issueName = $$.try('#content h2', issueElement).textContent;
        if (!issueName) {
            return;
        }

        // <h1 class="project-child">
        //   <a class="ancestor" href="/projects/2?jump=issues">Sample project</a>
        //   <span class="separator"> » </span>
        //   <a class="ancestor" href="/projects/1?jump=issues">Default Project</a>
        //   <span class="separator"> » </span>
        //   <span>
        //     <a class="self" href="/projects/6?jump=issues">Subproject</a>
        //   </span>
        //   <a class="icon icon-fav-off" id="favorite_project_6" title="Add to favorites" data-remote="true" rel="nofollow" data-method="post" href="/projects/6/favorite"></a>
        //   <span class="separator"> » </span>
        //   Subtask 1
        // </h1>
        var projectName = $$.try('h1 .self', issueElement).textContent;

        var serviceType = 'Redmine';

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new EasyRedmine());