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

        const fileIdMatch = source.path.match(/file\/([^\/]+)/);
        if (!fileIdMatch) {
            return;
        }

        const fileId = fileIdMatch[1];
        const issueUrl = `file/${fileId}`;
        const serviceUrl = source.protocol + source.host;

        const folderName = $$.try('[class*=filename_view--folderName]').textContent;
        const fileName = $$.try('[class*=filename_view--title]').textContent;
        const projectName = folderName && folderName == 'Drafts' ? fileName : `${folderName} / ${fileName}`;

        return {
            serviceType: 'Figma',
            serviceUrl,
            issueUrl,
            projectName,
        } as WebToolIssue;
    }
}

IntegrationService.register(new Figma());