class OldFreshdesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/helpdesk/tickets/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        var host = $$('.ticket-actions > ul');
        if (host) {

            linkElement.classList.add('btn');

            var container = $$.create('li', 'ticket-btns');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        //https://company.freshdesk.com/helpdesk/tickets/1
        var issueName = $$.try('.subject').textContent;

        var issueId = $$.try('#ticket-display-id').textContent;
        var serviceUrl = source.protocol + source.host;
        var issueUrl = source.path;

        var projectName = $$.try('.default_product .select2-chosen').textContent;

        if (projectName === '...') {
            projectName = "";
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'OldFreshdesk' };
    }
}

class NewFreshdesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/a/tickets/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        var host = $$('.page-actions__left');
        if (host) {
            let container = $$.create('button',
                'app-icon-btn', 'app-icon-btn--text', 'devart-timer-link-freshdesk'
            );
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        //https://company.freshdesk.com/a/tickets/1
        var issueName = $$.try('.description-subject').textContent;

        let issueId: string;
        let issueUrl: string;

        let matches = source.path.match(/\/a\/tickets\/(\d+)/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;

        let projectName: string;

        let projectNameContainer: HTMLElement;

        $$.all('.label-field').forEach(label => {
            if (projectNameContainer = this.getProjectContainer(label)) {
                return;
            }
        })

        if (projectNameContainer) {
            projectName = $$.try('.ember-power-select-selected-item', projectNameContainer).textContent;
            if (projectName) {
                projectName = projectName.trim();
            }
        }

        if (projectName === '--') {
            projectName = "";
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'NewFreshdesk' };
    }

    private getProjectContainer(label: HTMLElement) {
        // hardcoded label names
        switch (label.textContent) {
            case 'Product':
                return label.parentElement;
            default:
                return null;
        }
    }
}

IntegrationService.register(new OldFreshdesk(), new NewFreshdesk());