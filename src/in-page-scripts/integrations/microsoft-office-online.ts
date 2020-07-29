class MicrosoftOfficeOnline implements WebToolIntegration {

    showIssueId = false;

    // Supports Word Online, Excel Online, PowerPoint Online, OneNote Online
    matchUrl = 'https://*.officeapps.live.com';

    observeMutations = true;

    issueElementSelector = '#AppHeaderPanel';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // Exel, PowerPoint, OneNote, Word Preview Mode
        let anchor = $$('.UsernameContainer', issueElement);
        if (anchor) {
            linkElement.classList.add('devart-timer-link-microsoft-office-live', 'cui-ctl-medium');
            anchor.parentElement.insertBefore(linkElement, anchor.parentElement.firstElementChild);
            return;
        }

        // Word
        anchor = $$('#CustomCenterRegion', issueElement);
        if (anchor) {
            linkElement.classList.add('devart-timer-link-microsoft-office-live');
            linkElement.style.alignSelf = 'center';
            anchor.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueId: string;

        let link = <HTMLAnchorElement>$$('#SignoutLink');
        if (link) {

            // Excel, PowerPoint, OneNote, Word Preview Mode

            // Sign out link example:
            // https://login.live.com/logout.srf?ct=1562949350&rver=7.1.6819.0&lc=1033&id=281053&ru=https:%2F%2Fonedrive.live.com%2Fredir%3Fresid%3DOWNER_ID%25DOCUMENT_ID%26page%3DView&cbcxt=sky

            let match = /.*[\?\&]ru=([^&]+).*/.exec(link.href);
            if (!match) {
                return;
            }

            match = /.*[\?\&]resid=([^&]+).*/.exec(decodeURIComponent(match[1]));
            if (!match) {
                return;
            }

            issueId = match[1];

        } else {

            // Word

            (new URL(location.href)).searchParams.forEach(console.log);

            let resourceParam = (new URL(location.href)).searchParams.get('wopisrc');
            let match = /^https:\/\/wopi\.onedrive\.com\/wopi\/files\/(.+)$/.exec(resourceParam);
            if (!match) {
                return;
            }

            issueId = match[1];
        }

        if (!issueId) {
            return;
        }

        let issueUrl = `edit?resid=${issueId}`;

        let issueName = $$.try('#BreadcrumbTitle', issueElement).textContent || // Exel, PowerPoint, OneNote, Word Preview Mode
            $$.try('[data-unique-id="DocumentTitleContent"]', issueElement).textContent; // Word

        let serviceUrl = 'https://onedrive.live.com';

        let serviceType = 'MicrosoftOfficeOnline';

        return { issueName, issueId, issueUrl, serviceUrl, serviceType };
    }
}

IntegrationService.register(new MicrosoftOfficeOnline());