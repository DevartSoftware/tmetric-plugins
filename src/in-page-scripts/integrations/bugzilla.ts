class Bugzilla implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://*/show_bug.cgi*';

    issueElementSelector = '#bugzilla-body';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('#summary_alias_container', issueElement)
            || $$('#summary_container', issueElement)
            || $$('#field-value-status_summary', issueElement) // https://bugzilla.mozilla.org
        if (host) {
            linkElement.classList.add('devart-timer-link-bugzilla');
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueIdNumber = $$.try<HTMLInputElement>('input[name=id]', issueElement).value
            || $$.searchParams(source.fullUrl)['id'];
        if (!issueIdNumber) {
            return;
        }
        const issueId = '#' + issueIdNumber;

        const issueName = $$.try('#short_desc_nonedit_display', issueElement).textContent
            || $$.try('#field-value-short_desc', issueElement).textContent; // https://bugzilla.mozilla.org
        if (!issueName) {
            return;
        }

        const projectName = $$.try<HTMLSelectElement>('#product').value // editable project
            || ($$.try('#field_container_product').firstChild || {} as ChildNode).textContent // non editable project
            || ($$.try('#product-name').firstChild || {} as ChildNode).textContent; // https://bugzilla.mozilla.org

        const serviceType = 'Bugzilla';

        const action = 'show_bug.cgi';

        const serviceUrl = source.fullUrl.substring(0, source.fullUrl.indexOf(action));

        const issueUrl = `/${action}?id=${issueIdNumber}`;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Bugzilla());