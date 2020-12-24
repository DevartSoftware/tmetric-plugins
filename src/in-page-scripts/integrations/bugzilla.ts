class Bugzilla implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/show_bug.cgi*';

    issueElementSelector = '#bugzilla-body';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('#summary_alias_container', issueElement) || $$('#summary_container', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-bugzilla');
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueIdNumber = $$.try<HTMLInputElement>('input[name=id]', issueElement).value;
        if (!issueIdNumber) {
            return;
        }
        const issueId = '#' + issueIdNumber;

        const issueName = $$.try('#short_desc_nonedit_display', issueElement).textContent;
        if (!issueName) {
            return;
        }

        const projectNameEditableElement = $$<HTMLSelectElement>('#product');
        const projectNameNonEditableElement = $$.try('#field_container_product').firstChild;
        let projectName: string;
        if (projectNameEditableElement) {
            projectName = projectNameEditableElement.value;
        }
        else if (projectNameNonEditableElement) {
            projectName = projectNameNonEditableElement.textContent;
        }

        const serviceType = 'Bugzilla';

        const action = 'show_bug.cgi';

        const serviceUrl = source.fullUrl.substring(0, source.fullUrl.indexOf(action));

        const issueUrl = `/${action}?id=${issueIdNumber}`;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Bugzilla());