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

        let issueName = $$.try('#mtb').textContent || // event popup -> event title
            (<any>$$.try('.ep-title input')).value || // event detailed view (event edit) -> event title
            $$.try('.bubblecontent .gcal-contenteditable-textinput').textContent; // reminder popup -> reminder title

        if (!issueName) {
            let iframe = <HTMLIFrameElement>$$('.bubblecontent iframe');
            if (iframe) {
                let textArea = (<HTMLTextAreaElement>iframe.contentDocument.querySelector('textarea'));
                if (textArea) {
                    issueName = textArea.textContent;
                } else {
                    iframe.addEventListener('load', () => window.parsePage());
                }
            }
        }

        return { issueName };
    }
}

IntegrationService.register(new GoogleCalendar());