class Figma implements WebToolIntegration {

    matchUrl = 'https://www.figma.com/file/*';

    observeMutations = true;

    showIssueId = false;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const toolbar = $$('[class*=toolbar_view--rightButtonGroup]');
        if (toolbar) {
            linkElement.classList.add('devart-timer-link-figma');
            toolbar.insertBefore(linkElement, toolbar.firstElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

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