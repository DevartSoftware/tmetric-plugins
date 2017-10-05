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

        let issueName = $$.try('#mtb').textContent ||
            (<any>$$.try('.ep-title input')).value ||
            $$.try('.bubblecontent .gcal-contenteditable-textinput').textContent;

        if (!issueName) {
            let iframe = <HTMLIFrameElement>$$('.bubblecontent iframe');
            if (iframe) {
                issueName = iframe.contentDocument.querySelector('textarea').textContent;
                if (!issueName) {
                    return;
                }
            } else {
                return;
            }
        }

        return { issueName, serviceType: 'GoogleCalendar' };
    }
}

IntegrationService.register(new GoogleCalendar());