class YouTrack implements WebToolIntegration {

    showIssueId = true;

    matchUrl = [
        '*://*/issue/*',
        '*://*/issues',
        '*://*/agiles/*',
        '*://*/tickets/*'
    ];

    issueElementSelector = '.yt-issue-view, yt-agile-card';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host =
            $$('.yt-issue-view__meta-information', issueElement) ||
            $$('.yt-issue-toolbar', issueElement) ||
            $$('.yt-agile-card__summary', issueElement);

        if (host) {
            linkElement.classList.add('devart-timer-link-youtrack');
            host.appendChild(linkElement);
            const previousElementSibling = linkElement.previousElementSibling as HTMLElement;
            if (previousElementSibling && previousElementSibling.classList.contains('yt-issue-view__meta-information-updated-created')) {
                previousElementSibling.style.marginRight = '10px';
            }
        }
    }

    getIssue(issueElement: HTMLElement, _source: Source) {

        const issueName =
            $$('.yt-issue-body__summary', issueElement)?.textContent || // single task
            $$('yt-agile-card__summary > span', issueElement)?.textContent; // agile board

        if (!issueName) {
            return;
        }

        const linkElement = $$('.yt-issue-id', issueElement);
        const issueId = linkElement && linkElement.textContent;
        const issueUrl = linkElement && linkElement.getAttribute('href');

        const projectName = $$('yt-issue-project', issueElement)?.textContent;
        const tagNames = $$.all('.yt-issue-tags__tag__name', issueElement).map(_ => _.textContent);

        const serviceType = 'YouTrack';
        const serviceUrl = $$<HTMLBaseElement>('base')?.href;

        return {
            issueId, issueName, projectName, tagNames, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

class YouTrackLite implements WebToolIntegration {

    showIssueId = true;

    matchUrl = [
        '*://*/issue/*',
        '*://*/issues',
        '*://*/agiles/*',
        '*://*/tickets/*'
    ];

    issueElementSelector = '[class^=ticketContent__]';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host =
            $$('[data-test="updater-info"]', issueElement) ||
            $$('[data-test="reporter-info"]', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-youtrack-lite');
            host.parentElement!.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, _source: Source) {

        const issueName = $$('h1[data-test="ticket-summary"]', issueElement)?.textContent;
        if (!issueName) {
            return;
        }

        const serviceType = 'YouTrack';

        const serviceUrl = $$<HTMLBaseElement>('base')?.href;

        const linkElement =
            $$('[class^=sidebarContainer_] [class^=idLink_] a', issueElement) ||
            $$('[class^=idLink_] a', issueElement);

        const issueId = linkElement && linkElement.textContent;

        const issueUrl = linkElement && serviceUrl && $$.getRelativeUrl(serviceUrl, linkElement.getAttribute('href')!);

        const projectField = $$('div[aria-label="Project"]', issueElement)?.textContent;
        const projectName = projectField ? projectField.substring('Project'.length) : null;

        const tagNames = $$.all('[class^=tags_] a', issueElement).map(_ => _.textContent);

        return {
            issueId, issueName, projectName, tagNames, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new YouTrack(), new YouTrackLite());