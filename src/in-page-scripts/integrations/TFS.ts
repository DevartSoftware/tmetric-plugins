module Integrations {

    class TfsIntegration implements WebToolIntegration {

        observeMutations = true;

        matchUrl = '*://*.visualstudio.com/*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var toolbar = $$('.work-item-form > .workitem-tool-bar > ul') || $$('.work-item-form-headerContent ul.menu-bar');
            if (!toolbar) {
                return;
            }

            var linkContainer = $$.create('li', 'menu-item');
            linkContainer.appendChild(linkElement);

            if ($$('.new-work-item-view')) {
                toolbar.insertBefore(linkContainer, $$('li[title=Actions]'));
            }
            else {
                var separator = $$('li.menu-item.menu-item-separator:not(.invisible)', toolbar)
                toolbar.insertBefore(linkContainer, separator);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            if (!$$('.workitem-info-bar')) {
                return;
            }

            var issueName, issueLink;

            if ($$('.new-work-item-view')) {
                // route for the new TFS interface
                issueName = $$('.work-item-form-title input', true).title;
                issueLink = $$('.work-item-form-id a');
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
                    var issueId = issueIdRegExp[1];
                }
            }

            var projectName = $$('.header-item.project-selector-nav-menu > li > span', true).textContent;

            // https://devart.visualstudio.com/
            var serviceUrl = source.protocol + source.host;

            return { issueId: issueId, issueName: issueName, issueUrl: issueUrl, serviceUrl: serviceUrl, serviceType: 'TFS' };
        }
    }

    IntegrationService.register(new TfsIntegration());
}