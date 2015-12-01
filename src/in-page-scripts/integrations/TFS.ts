module Integrations {

    class TfsIntegration implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*.visualstudio.com/*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            var form = $$.visible('.work-item-form');
            if (!form) {
                return;
            }

            var isNewView = !!$$('.new-work-item-view', form);
            var anchor: HTMLElement;

            if (isNewView) {
                // find anchor in single item view or triage item view
                anchor = $$.visible('.hub-title .workitem-header-toolbar .menu-bar') || $$.visible('.workitem-header-toolbar .menu-bar', form);
            } else {
                anchor = $$.visible('.workitem-tool-bar .menu-bar', form);
            }

            if (!anchor) {
                return;
            }

            var linkContainer = $$.create('li', 'menu-item');
            linkContainer.classList.add('vsts');
            linkContainer.appendChild(linkElement);

            if (isNewView) {
                linkContainer.classList.add('right-align');
                anchor.insertBefore(linkContainer, anchor.firstElementChild);
            } else {
                anchor.appendChild(linkContainer);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            if (!$$('.workitem-info-bar a.caption')) {
                return;
            }

            var form = $$.visible('.work-item-form');
            if (!form) {
                return;
            }

            var isNewView = !!$$('.new-work-item-view', form);
            var issueName: string;
            var issueLink: HTMLElement;

            if (isNewView) {
                // route for the new TFS interface
                issueName = $$('.work-item-form-title input', form, true).title;
                issueLink = $$('.info-text-wrapper a');
            }
            else {
                issueName = $$('.workitem-info-bar', true).title;
                issueLink = $$('.workitem-info-bar a');
            }

            if (!issueName) {
                // nothing to do without issue name
                return;
            }

            if (issueLink) {
                // remove additional arguments, e.g. .../_workitems/edit/1?fullScreen=false -> .../_workitems/edit/1
                var issueUrl = issueLink.getAttribute('href').replace(/\?.*$/, '');

                // _workitems/edit/1
                var issueIdRegExp = /\/edit\/(\d*$)/.exec(issueUrl);
                if (issueIdRegExp && issueIdRegExp.length === 2) {
                    var issueId = '#' + issueIdRegExp[1];
                }
                else {
                    issueUrl = null;
                }
            }

            var projectName = $$('.header-item.project-selector-nav-menu > li > span', true).textContent;

            // https://devart.visualstudio.com/
            var serviceUrl = source.protocol + source.host;

            var serviceType = 'TFS';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new TfsIntegration());
}