class GoogleCalendar implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://calendar.google.com/calendar/*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // detail view
        let detailedView = $$('.ep .ep-dpc', issueElement);
        if (detailedView) {
            linkElement.classList.add('devart-timer-link-google-calendar-detailed');
            detailedView.insertBefore(linkElement, detailedView.firstChild);
        }

        // popup view
        let popup = $$('.bubblecontent');
        if (popup) {
            linkElement.classList.add('devart-timer-link-google-calendar-popup');
            popup.insertBefore(linkElement, popup.firstChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('#mtb').textContent || (<any>$$.try('.ep-title input')).value;
        if (!issueName) {
            return;
        }

        return { issueName, serviceType: 'GoogleCalendar' };
    }
}

IntegrationService.register(new GoogleCalendar());