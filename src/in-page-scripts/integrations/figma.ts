class Figma implements WebToolIntegration {

    matchUrl = 'https://www.figma.com/design/*';

    showIssueId = false;

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {
        const toolbar = $$('[class*=toolbar_view--menuButtonNew]');
        if (toolbar) {
            linkElement.classList.add('devart-timer-link-figma');
            toolbar.parentNode?.insertBefore(linkElement, toolbar.nextSibling);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const fileName = $$.try('[class*=filename_view--title]').textContent;
        if (!fileName) {
            return;
        }

        const folderName = $$.try('[class*=filename_view--folderName]').textContent;
        const projectName = (!folderName || folderName == 'Drafts') ? fileName : `${folderName} / ${fileName}`;

        return {
            serviceType: 'Figma',
            serviceUrl: source.protocol + source.host,
            projectName,
        } as WebToolIssue;
    }
}

IntegrationService.register(new Figma());