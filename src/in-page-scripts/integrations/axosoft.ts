class Axosoft implements WebToolIntegration {

    showIssueId = true;

    // Workspace task url:
    // https://ACCOUNT_NAME.axosoft.com/*
    matchUrl = '*://*.axosoft.com/*';

    issueElementSelector = '.item-form-body';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const host = $$('.item-field-id', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-axosoft');
            host.parentElement!.insertBefore(linkElement, host.nextElementSibling);
        }
    }

    issueTypes = {
        'Bug': 'defects',
        'Feature': 'features',
        'Ticket': 'incidents',
        'Work Item': 'features'
    };

    getIssue(issueElement: HTMLElement, source: Source) {

        const issueName =
            $$.try<HTMLInputElement>('.item-field-name input', issueElement).value ||
            $$.try('.item-field-name', issueElement).textContent;
        if (!issueName) {
            return;
        }

        const projectNameCell = $$.all('.item-field-table .item-field-row > div', issueElement).filter(div => {
            return $$.try('.item-field-label', div).textContent == 'Project:';
        })[0];
        const projectNameField = projectNameCell && $$('.field', projectNameCell);
        let projectName: string | null = null;
        if (projectNameField) {
            projectName = $$.try<HTMLInputElement>('input', projectNameField).value // edit form
                || projectNameField.textContent; // view form
        }

        const serviceType = 'Axosoft';
        const serviceUrl = source.protocol + source.host;

        let issueId = $$.try('.item-field-id').textContent;
        let issueUrl: string | undefined;
        if (issueId) {
            const issueType = this.issueTypes[$$.try('.form-subtitle').textContent!] || this.issueTypes.Feature;
            issueUrl = '/viewitem?id=' + issueId + '&type=' + issueType;
            if (/^\d+$/.test(issueId)) {
                issueId = '#' + issueId;
            }
        }

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new Axosoft());