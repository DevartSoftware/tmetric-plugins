module Integrations {

    class TfsIntegration implements WebToolIntegration {

        showIssueId = true;

        observeMutations = true;

        matchUrl = [
            // Visual Studio Team Services
            '*://*.visualstudio.com/*',
            // Visual Studio Team Foundation Server
            '*://*/_home*',
            '*://*/_dashboards*',
            '*://*/_backlogs*',
            '*://*/_workitems*'
        ];

        issueElementSelector = () => $$.all('.work-item-form');

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let host = $$.visible('.work-item-form-headerContent', issueElement);
            if (!host) {
                return;
            }

            let linkContainer = $$.create('div', 'devart-timer-link-tfs');
            linkContainer.appendChild(linkElement);
            host.insertBefore(linkContainer, host.firstElementChild);
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issue = (<HTMLInputElement>$$.visible('.work-item-form-title input', issueElement));
            if (!issue) {
                // nothing to do without issue name
                return;
            }

            let issueName = issue.value;
            let issueId: string;
            let issueUrl: string;

            // find the nearest info-text-wrapper anchor
            let parent = issueElement;
            while (parent) {
                let issueUrlElement = $$('.info-text-wrapper a', parent);
                if (issueUrlElement) {
                    issueUrl = issueUrlElement.getAttribute('href');
                    break;
                }
                parent = parent.parentElement;
            }

            if (issueUrl) {
                // /ProjectName/_workitems/edit/1
                // /ProjectName/_workitems/edit/1?fullScreen=false
                let issueIdRegExp = /\/edit\/(\d*)(\?.*)?$/.exec(issueUrl);
                if (issueIdRegExp) {
                    issueId = '#' + issueIdRegExp[1];
                }
                else {
                    issueUrl = null;
                }
            }

            // https://devart.visualstudio.com/
            let serviceUrl = source.protocol + source.host;
            let serviceType = 'TFS';
            let projectName = (<HTMLInputElement>$$.try('.work-item-form-areaIteration input', issueElement)).value;

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new TfsIntegration());
}