module Integrations {

    class Bugzilla implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*/show_bug\\.cgi\\?*';

        issueElementSelector = '#bugzilla-body';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('#summary_alias_container', issueElement) || $$('#summary_container', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-bugzilla');
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            // Bug url:
            // *://*/show_bug.cgi?NAME=VALUE&id=BUG_ID&NAME=VALUE

            var match = /^(.+)\/(show\_bug\.cgi\?)(.+)$/.exec(source.fullUrl);

            var result;

            if (match) {

                var issueIdNumber = $$.try<HTMLInputElement>('input[name=id]', issueElement).value;
                if (!issueIdNumber) {
                    return;
                }
                var issueId = '#' + issueIdNumber;

                var issueName = $$.try('#short_desc_nonedit_display', issueElement).textContent;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                var projectNameEditableElement = $$<HTMLSelectElement>('#product');
                var projectNameNonEditableElement = $$.try('#field_container_product').firstChild;
                var projectName: string;
                if (projectNameEditableElement) {
                    projectName = projectNameEditableElement.value;
                } else if (projectNameNonEditableElement) {
                    projectName = projectNameNonEditableElement.textContent;
                }
                if (!projectName) {
                    return;
                }
                projectName = projectName.trim();

                var serviceType = 'Bugzilla';

                var serviceUrl = match[1];

                var issueUrl = match[2] + 'id=' + issueIdNumber;

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
            }
            return result;
        }
    }

    IntegrationService.register(new Bugzilla());
}