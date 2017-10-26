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

class NewGoogleCalendar implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://calendar.google.com/calendar/*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // Task popup
        let taskContainer = $$('div[data-taskid]');
        if (taskContainer) {
            linkElement.style.cssFloat = 'right';
            linkElement.style.padding = '13px 24px';

            // When switching cards, the target element for insertion wraped into the empty elements.
            // In this way We define what the elemenet we need.
            let target: Node;
            if (taskContainer.children[0].hasChildNodes()) {
                target = taskContainer.children[1];
            } else {
                target = taskContainer.children[2]
            }

            taskContainer.insertBefore(linkElement, target);
        }

        // Event popup
        let eventContainer = $$('div[data-eventid][id]');
        if (eventContainer) {
            linkElement.style.textAlign = 'right';
            linkElement.style.padding = '13px 24px';

            // When switching cards, the target element for insertion wraped into the empty elements.
            // In this way We define what the elemenet we need.
            let target: Node;
            if (eventContainer.children[0].hasChildNodes()) {
                target = eventContainer.children[0];
            } else {
                target = eventContainer.children[1];
            }

            target.insertBefore(linkElement, target.lastChild);
        }

        // Event editor
        let container = $$('#YPCqFe > div > div > div > div');
        if (container && window.location.pathname.indexOf('eventedit/') > -1) {
            linkElement.style.marginLeft = '63px';
            let parent = container.parentElement;
            parent.insertBefore(linkElement, parent.lastChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let issueName = $$.try('#rAECCd').textContent; // Get event or task title from  popup

        // Get title from event editor
        if (!issueName && source.path.indexOf('eventedit/') > -1) {
            let container = $$('#YPCqFe > div > div > div > div');
            issueName = (<any>$$.try('input', container)).value;
        }

        return { issueName };
    }
}

IntegrationService.register(new GoogleCalendar(), new NewGoogleCalendar());