module Integrations {

    class PodioAppItem implements WebToolIntegration {

        showIssueId = false;

        matchUrl = '*://podio.com/*/apps/*';

        observeMutations = true;

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let actionBar = $$('.action-bar ul');
            if (actionBar) {
                let container = $$.create('li');
                container.classList.add('float-left', 'devart-timer-link-podio');
                container.appendChild(linkElement);
                actionBar.insertBefore(container, actionBar.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueId = null;
            let issueUrl = null;
            let issueName = $$.try('.breadcrumb .item-title').textContent;
            let serviceUrl = source.protocol + source.host;
            let projectName = null;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'PodioAppItem' };
        }
    }

    IntegrationService.register(new PodioAppItem());
}