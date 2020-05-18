class GoogleCalendar implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://calendar.google.com/calendar/*';

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

        // get issueName from task popup
        if (!issueName) {
            let iframe = <HTMLIFrameElement>$$('.bubblecontent iframe');
            if (iframe) {
                let textArea = (<HTMLTextAreaElement>iframe.contentDocument.querySelector('textarea'));
                if (textArea) {
                    issueName = textArea.value;
                } else {
                    iframe.addEventListener('load', () => window.parsePage());
                }
            }
        }

        let serviceUrl = source.protocol + source.host;

        return { issueName, serviceUrl: serviceUrl, serviceType: 'GoogleCalendar' };
    }
}

class NewGoogleCalendar implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://calendar.google.com/calendar/*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // Find task deskription container and add link as its sibling

        // Event, task or reminder popup
        let container = $$('.Tnsqdc .pPTZAe');
        if (container) {
            linkElement.classList.add('devart-timer-link-google-calendar-popup-modern');
            container.insertBefore(linkElement, container.firstElementChild);
            return;
        }

        // Event editor
        container = $$.closest('.UXzdrb', $$('#xTiIn'));
        if (container) {
            linkElement.style.marginLeft = '64px';
            container.parentNode.insertBefore(linkElement, container.nextSibling);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueName = $$.try('#rAECCd').textContent // Event, task or reminder popup
            || (<any>$$.try('#xTiIn')).value; // Event editor

        let serviceUrl = source.protocol + source.host;

        return { issueName, serviceUrl: serviceUrl, serviceType: 'GoogleCalendar' };
    }
}

IntegrationService.register(new GoogleCalendar(), new NewGoogleCalendar());