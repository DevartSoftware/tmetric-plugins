class OldFreshdesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/helpdesk/tickets/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('.ticket-actions > ul');
        if (host) {

            linkElement.classList.add('btn');

            let container = $$.create('li', 'ticket-btns');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // https://company.freshdesk.com/helpdesk/tickets/1
        let issueName = $$.try('.subject').textContent;
        let issueUrl: string;

        let issueId = $$.try('#ticket-display-id').textContent;
        if (issueId) {
            issueId = issueId.replace('#', '');
            issueUrl = '/a/tickets/' + issueId;
        }

        let serviceUrl = source.protocol + source.host;

        let projectName = $$.try('.default_product .select2-chosen').textContent;
        if (projectName === '...') {
            projectName = '';
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Freshdesk' };
    }
}

class NewFreshdesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/a/tickets/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let host = $$('.page-actions__left');
        if (host) {
            let container = $$.create('button',
                'app-icon-btn', 'app-icon-btn--text', 'devart-timer-link-freshdesk'
            );
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // https://company.freshdesk.com/a/tickets/1
        let issueName = $$.try('.description-subject').textContent;

        let issueId: string;
        let issueUrl: string;

        let matches = source.path.match(/\/a\/tickets\/(\d+)/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        let serviceUrl = source.protocol + source.host;

        let projectName: string;

        let projectLabel = $$('.label-field', null, label => ['Product'].indexOf(label.textContent) >= 0);
        if (projectLabel) {
            let projectElement = $$('.ember-power-select-selected-item', projectLabel.parentElement);
            projectName = projectElement && projectElement.textContent.trim();
        }

        if (projectName === '--') {
            projectName = '';
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Freshdesk' };
    }
}

IntegrationService.register(new OldFreshdesk(), new NewFreshdesk());