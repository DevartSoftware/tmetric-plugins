class Evernote implements WebToolIntegration {

    matchUrl = '*://www.evernote.com/client/*';

    issueElementSelector = '#qa-NOTE_HEADER';

    showIssueId = false;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const div = $$.create('div');
        div.classList.add('devart-timer-link-evernote');
        div.appendChild(linkElement);
        const separator = $$.create('div', '_3QvRa8NWQ7oFT2wasqKjdo');
        div.appendChild(separator);
        issueElement.lastChild!.before(div);
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        // try to get issue name from editor
        const frame = $$<HTMLIFrameElement>('#qa-COMMON_EDITOR_IFRAME');
        const frameDocument = frame?.contentDocument;

        let issueName: string | null | undefined;
        if (frame?.tagName === 'IFRAME' && frameDocument) {
            issueName = $$<HTMLTextAreaElement>('en-noteheader textarea', frameDocument)?.value;

            // if read-only note
            if (!issueName) {
                issueName = $$.try('[data-testid=view-only-title]', frameDocument).textContent;
            }
        }

        const projectName = $$.try('#qa-NOTE_PARENT_NOTEBOOK_BTN', issueElement).textContent;
        const issueId = $$.searchParams(location.hash)['n'];
        const issueUrl = issueId && `${source.path}#?n=${issueId}`;
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Evernote';

        return {
            issueName, issueId, issueUrl, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new Evernote());