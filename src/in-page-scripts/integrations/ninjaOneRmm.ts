class NinjaOneRmm implements WebToolIntegration {

    showIssueId = true;

    match() {
        return !!$$(this.issueElementSelector);
    }

    /**
     * The identifier of the element, which contains the task details
     * and inside which the button will be rendered.
     */
    issueElementSelector = '.css-1pl69ym';

    /**
     * Extracts information about the issue (ticket or task) from a Web
     * page by querying the DOM model.
     */
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueId = $$.try(
            '.breadcrumb-history-path .last-link',
            issueElement
        ).textContent;

        const issueName = $$.try<HTMLInputElement>(
            '.css-1a3i6ho input',
            issueElement
        ).value;
        if (!issueName) {
            return;
        }

        const serviceUrl = source.protocol + source.host;

        const issueUrl = `/#/ticketing/ticket/${issueId ? issueId.replace('#', '') : ''}`;

        const projectName = $$.try(
            '.css-34fts7 div:first-child .css-xpxtxf span',
            issueElement
        ).textContent;

        console.log(projectName);

        let tagNames = [];
        $$.all('.css-4juktp', issueElement).forEach((element) => {
            if ($$.try('.css-4juktp span', element).textContent == 'Tags') {
                tagNames = tagNames.concat(
                    $$.all('.css-161u6g7 .text-ellipsis', element).map(
                        (label) => label.textContent
                    )
                );
            }
        });

        const serviceType = 'NinjaOneRmm'
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType, tagNames };
    }

    /**
     * Inserts the timer button for the identified issue into a Web page.
     */
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.css-19ejha5', issueElement);
        if (host) {
            const span = $$.create('span', 'css-17loz3m');
            span.setAttribute('data-reach-listbox-button', '');
            span.appendChild(linkElement);
            const container = $$.create('div');
            container.appendChild(span);
            host.appendChild(container);
        }
    }
}

IntegrationService.register(new NinjaOneRmm());
