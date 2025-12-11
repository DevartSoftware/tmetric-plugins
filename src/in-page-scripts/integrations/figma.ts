class Figma implements WebToolIntegration {

    matchUrl = 'https://www.figma.com/design/*';

    showIssueId = false;

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {
        const toolbar = $$('[class*=toolbar_view--menuButtonNew]');
        if (toolbar) {
            linkElement.classList.add('devart-timer-link-figma');

            if (toolbar.parentElement?.getAttribute('data-testid') === 'navigation-bar-top-section') {
                linkElement.classList.add('minimal');
            }

            if (this.isDarkTheme()) {
                linkElement.classList.add('secondary-color');
            }

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

    private isDarkTheme() {
        // 1. find theme via preferred-theme attribute
        const dataTheme = document.body.dataset.preferredTheme;
        if (dataTheme) {
            return dataTheme === 'dark';
        }

        // 2. find theme via classList
        if (document.body.classList.contains('theme-dark')) {
            return true;
        }
        if (document.body.classList.contains('theme-light')) {
            return false;
        }

        // 3. system theme (fallback)
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
}

IntegrationService.register(new Figma());