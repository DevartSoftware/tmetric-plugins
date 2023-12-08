class OldFreshdesk implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://*/helpdesk/tickets/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('.ticket-actions > ul');
        if (host) {

            linkElement.classList.add('btn');

            let container = $$.create('li', 'ticket-btns');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        // https://company.freshdesk.com/helpdesk/tickets/1
        let issueName = $$.try('.subject').textContent;
        let issueUrl: string | undefined;

        let issueId = $$.try('#ticket-display-id').textContent;
        if (issueId) {
            issueId = issueId.replace('#', '');
            issueUrl = '/a/tickets/' + issueId;
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Freshdesk';

        let projectName = $$.try('.default_product .select2-chosen').textContent;
        if (projectName === '...') {
            projectName = '';
        }

        return {
            issueId, issueName, issueUrl, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

class NewFreshdesk implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://*/a/tickets/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const host = $$('.page-actions__left');
        if (host) {
            linkElement.classList.add('app-icon-btn', 'app-icon-btn--text', 'devart-timer-link-freshdesk');
            host.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        // https://company.freshdesk.com/a/tickets/1
        const issueName = $$.try('.ticket-subject-heading').textContent;

        let issueId: string | undefined;
        let issueUrl: string | undefined;

        let matches = source.path.match(/\/a\/tickets\/(\d+)/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        let projectName: string | null | undefined;

        let projectLabel = $$('.label-field', null, label => ['Product'].indexOf(label.textContent!) >= 0);
        if (projectLabel) {
            let projectElement = $$('.ember-power-select-selected-item', projectLabel.parentElement);
            projectName = projectElement && projectElement.textContent?.trim();
        }

        if (projectName === '--') {
            projectName = '';
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Freshdesk';

        return {
            issueId, issueName, issueUrl, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new OldFreshdesk(), new NewFreshdesk());