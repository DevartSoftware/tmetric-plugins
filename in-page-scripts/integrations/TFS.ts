/// <reference path="../../interfaces/integrations" />
/// <reference path="../IntegrationService" />
/// <reference path="../utils" />

module Integrations {
    class TfsIntegration implements WebToolIntegration {
        //observeMutations = true;

        match(source: Source): boolean {
            return !!$$('meta[name=msapplication-config]');
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            return;
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            if (!$$('div.ui-dialog.workitem-dialog')) {
                return null;
            }

            var issueName = $$('.workitem-info-bar', true).title;                    //.workitem-info-bar
            if (!issueName) {
                // nothing to do without issue name
                return;
            }

            var projectName = $$('.header-item.project-selector-nav-menu > li > span').textContent;

            var issueId = $$('.workitem-info-bar > a', true).textContent;           //.workitem-info-bar
            var issueUrl = $$('.workitem-info-bar a.caption').getAttribute('href'); //.workitem-info-bar
            var serviceUrl;

            return null;
        }
    }

    IntegrationService.register(new TfsIntegration());
}