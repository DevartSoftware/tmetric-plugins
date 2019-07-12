class MicrosoftOfficeOnline implements WebToolIntegration {

    showIssueId = false;

    // Supports Word Online, Excel Online, PowerPoint Online, OneNote Online
    matchUrl = 'https://*.officeapps.live.com';

    observeMutations = true;

    issueElementSelector = '#AppHeaderPanel';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let anchor = $$('.UsernameContainer', issueElement);
        if (anchor) {
            linkElement.classList.add('devart-timer-link-microsoft-office-live', 'cui-ctl-medium');
            anchor.parentElement.insertBefore(linkElement, anchor.parentElement.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let link = <HTMLAnchorElement>$$('#SignoutLink');
        if (!link) {
            return;
        }

        let match = /.*[\?\&]ru=([^&]+).*/.exec(link.href);
        if (!match) {
            return;
        }

        match = /.*[\?\&]resid=([^&]+).*/.exec(decodeURIComponent(match[1]));
        if (!match) {
            return;
        }

        let issueId = match[1];

        let issueUrl = `edit.aspx?resid=${issueId}`;

        let issueName = $$.try('#BreadcrumbTitle', issueElement).textContent;

        let serviceUrl = 'https://onedrive.live.com';

        let serviceType = 'MicrosoftOfficeOnline';

        return { issueName, issueId, issueUrl, serviceUrl, serviceType };
    }
}

IntegrationService.register(new MicrosoftOfficeOnline());