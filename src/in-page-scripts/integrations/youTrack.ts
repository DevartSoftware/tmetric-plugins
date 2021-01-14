class YouTrack implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = [
        '*://*/issue/*',
        '*://*/agiles/*'
    ];

    issueElementSelector = '.yt-issue-view, yt-agile-card';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host =
            $$('.yt-issue-view__meta-information', issueElement) ||
            $$('.yt-issue-toolbar', issueElement) ||
            $$('.yt-agile-card__summary', issueElement);

        if (host) {
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueName =
            $$.try('.yt-issue-body__summary', issueElement).textContent || // single task
            $$.try('yt-agile-card__summary > span', issueElement).textContent; // agile board

        if (!issueName) {
            return;
        }

        const linkElement = $$('.yt-issue-id', issueElement);

        const issueId = linkElement && linkElement.textContent;

        const issueUrl = linkElement && linkElement.getAttribute('href');

        const projectName = $$.try('yt-issue-project', issueElement).textContent;

        const tagNames = $$.all('.yt-issue-tags__tag__name', issueElement).map(_ => _.textContent);

        const serviceType = 'YouTrack';

        const serviceUrl = (<HTMLBaseElement>$$.try('base')).href;

        return { issueId, issueName, projectName, tagNames, serviceType, serviceUrl, issueUrl };
    }
}

class YouTrackOld implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/issue/*';

    issueElementSelector = '.content_fsi .toolbar_fsi';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        issueElement.appendChild(linkElement);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Full url:
        // https://HOST/PATH/issue/ISSUE_ID#PARAMETERS
        const match = /^(.+)\/issue\/(.+)$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        const issueId = $$.try('.issueId', issueElement).textContent;
        if (!issueId) {
            return;
        }

        const issueName = $$.try('.issue-summary', issueElement).textContent;
        if (!issueName) {
            return;
        }

        const projectName = $$.try('.fsi-properties .fsi-property .attribute.bold').textContent;

        const serviceType = 'YouTrack';

        const serviceUrl = match[1];

        const issueUrl = 'issue/' + issueId;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

class YouTrackBoardOld implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/rest/agile/*/sprint/*';

    issueElementSelector = '#editIssueDialog';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('.sb-issue-edit-id', issueElement);
        if (host) {
            host.parentElement.insertBefore(linkElement, host.nextElementSibling);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Full url:
        // https://HOST/PATH/rest/agile/*/sprint/*
        const match = /^(.+)\/rest\/agile\/(.+)$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        const issueId = $$.try('.sb-issue-edit-id', issueElement).textContent;
        if (!issueId) {
            return;
        }

        const issueName =
            $$.try<HTMLInputElement>('.sb-issue-edit-summary input', issueElement).value || // logged in
            $$.try('.sb-issue-edit-summary.sb-disabled', issueElement).textContent; // not logged in
        if (!issueName) {
            return;
        }

        // project name can be resolved for logged in users only
        const projectSelector = $$('.sb-agile-dlg-projects');
        const projectName = projectSelector ? $$.try('label[for=editAgileProjects_' + issueId.split('-')[0] + ']', projectSelector).textContent : null;

        const serviceType = 'YouTrack';

        const serviceUrl = match[1];

        const issueUrl = 'issue/' + issueId;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new YouTrack(), new YouTrackOld(), new YouTrackBoardOld());