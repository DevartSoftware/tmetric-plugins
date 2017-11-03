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

        return { issueName };
    }
}

class NewGoogleCalendar implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://calendar.google.com/calendar/*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // Find task deskription container and add link as its sibling

        // Event or task popup
        let container = $$.closest('.Tnsqdc', $$('#rAECCd'));
        if (container) {
            linkElement.style.cssFloat = 'right';
            linkElement.style.padding = '16px 16px 0 0';
            let div = document.createElement('div');
            div.appendChild(linkElement);
            container.parentNode.insertBefore(div, container.nextElementSibling);
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

        let issueName = $$.try('#rAECCd').textContent // Event or task popup
            || (<any>$$.try('#xTiIn')).value; // Event editor

        return { issueName };
    }
}

IntegrationService.register(new GoogleCalendar(), new NewGoogleCalendar());