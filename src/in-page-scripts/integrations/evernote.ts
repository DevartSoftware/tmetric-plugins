class Evernote implements WebToolIntegration {

    matchUrl = '*://www.evernote.com/client/*';

    issueElementSelector = '#qa-NOTE_HEADER';

    showIssueId = false;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let div = $$.create('div');
        div.classList.add('devart-timer-link-evernote');
        div.appendChild(linkElement);
        let separator = $$.create('div', '_3QvRa8NWQ7oFT2wasqKjdo');
        div.appendChild(separator);
        issueElement.lastChild.before(div);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // try to get issue name from editor
        const frame = $$<HTMLIFrameElement>('#qa-COMMON_EDITOR_IFRAME');
        const frameDocument = frame?.contentDocument;

        if (frame?.tagName === 'IFRAME' && frameDocument) {
            var issueName = ($$.try('en-noteheader textarea', frameDocument) as HTMLTextAreaElement).value;

            // if read-only note
            if (!issueName) {
                issueName = $$.try('[data-testid=view-only-title]', frameDocument).textContent;
            }
        }

        let projectName = $$.try('#qa-NOTE_PARENT_NOTEBOOK_BTN', issueElement).textContent;
        let issueId = $$.searchParams(location.hash)['n'];
        let issueUrl = issueId && `${source.path}#?n=${issueId}`;
        let serviceUrl = source.protocol + source.host;

        return { issueName, issueId, issueUrl, projectName, serviceUrl, serviceType: 'Evernote' };
    }
}

IntegrationService.register(new Evernote());