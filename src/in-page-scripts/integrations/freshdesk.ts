class Freshdesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = ['*://*/helpdesk/tickets/*', '*://*/a/tickets/*'];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let oldFreshHost = $$('.ticket-actions > ul');
        let newFreshHost = $$('.page-actions__left');

        if (newFreshHost) {
            let container = $$.create('button',
                'app-icon-btn', 'app-icon-btn--text', 'devart-timer-link-freshdesk'
            );
            container.appendChild(linkElement);
            newFreshHost.appendChild(container);
        } else if (oldFreshHost) {
            linkElement.classList.add('btn');

            var container = $$.create('li', 'ticket-btns');
            container.appendChild(linkElement);
            oldFreshHost.appendChild(container);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.description-subject').textContent ||
            $$.try('.subject').textContent;

        let issueId: string;
        let issueUrl: string;

        let matches = source.path.match(/\/*\/tickets\/(\d+)/);
        if (matches) {
            issueUrl = '/a' + matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;

        let projectName: string;

        let projectLabel = $$('.label-field', null, label => ['Product'].indexOf(label.textContent) >= 0);
        if (projectLabel) { // new freshdesk
            let projectElement = $$('.ember-power-select-selected-item', projectLabel.parentElement);
            projectName = projectElement && projectElement.textContent.trim();
        } else { // old freshdesk
            projectName = $$.try('.default_product .select2-chosen').textContent;
        }

        if (projectName === '--' || projectName == '...') {
            projectName = '';
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Freshdesk' };
    }
}

IntegrationService.register(new Freshdesk());