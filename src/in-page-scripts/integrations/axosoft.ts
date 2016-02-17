module Integrations {

    class Axosoft implements WebToolIntegration {

        observeMutations = true;

        // Workspace task url:
        // https://ACCOUNT_NAME.axosoft.com/*
        matchUrl = '*://*.axosoft.com/*';

        issueElementSelector = '.item-form-body';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.item-field-id', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-axosoft');
                host.parentElement.insertBefore(linkElement, host.nextElementSibling);
            }
        }

        issueTypes = {
            'Bug': 'defects',
            'Feature': 'features',
            'Ticket': 'incidents',
            'Work Item': 'features'
        };

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            var issueName =
                $$.try<HTMLInputElement>('.item-field-name input', issueElement).value ||
                $$.try('.item-field-name', issueElement).textContent;
            if (!issueName) {
                return;
            }

            var projectNameCell = $$.all('.item-field-table .item-field-row > div', issueElement).filter(div => {
                return $$.try('.item-field-label', div).textContent == 'Project:';
            })[0];
            var projectNameField = projectNameCell && $$('.field', projectNameCell);
            if (projectNameField) {
                var projectNameSelect = <HTMLSelectElement>$$('select', projectNameField);
                var projectName = projectNameSelect ?
                    (projectNameSelect.options[projectNameSelect.selectedIndex] || {}).textContent : // edit form
                    projectNameField.textContent; // view form
            }

            var serviceType = 'Axosoft';

            var issueId = $$.try('.item-field-id').textContent;
            if (issueId) {
                var serviceUrl = source.protocol + source.host;
                var issueType = this.issueTypes[$$.try('.form-subtitle').textContent] || this.issueTypes.Feature;
                var issueUrl = 'viewitem?id=' + issueId + '&type=' + issueType;
                if (/^\d+$/.test(issueId)) issueId = '#' + issueId;
            }

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Axosoft());
}