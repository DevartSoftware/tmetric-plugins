module Integrations {

    class TfsIntegration implements WebToolIntegration {

        private static isDisplay(element?: HTMLElement): boolean {
            if (element) {
                return element.style.display !== 'none';
            } else {
                return false;
            }
        }

        private static isDisplayBranch(element?: HTMLElement): boolean {
            if (element) {
                if (!TfsIntegration.isDisplay(element)) {
                    return false;
                } else {
                    if (element === document.body) {
                        return true;
                    } else {
                        return TfsIntegration.isDisplayBranch(element.parentElement);
                    }
                }
            } else {
                return false;
            }
        }

        observeMutations = true;

        matchUrl = '*://*.visualstudio.com/*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            var form = $$.all('.work-item-form').filter(TfsIntegration.isDisplayBranch)[0];
            if (!form) {
                return;
            }

            var isNewView = !!$$('.new-work-item-view', form);
            var anchor;

            if (isNewView) {
                // find anchor in single item view or triage item view
                anchor = $$('.hub-title .workitem-header-toolbar .menu-bar') || $$('.workitem-header-toolbar .menu-bar', form);
            } else {
                anchor = $$('.workitem-tool-bar .menu-bar', form);
            }

            if (!TfsIntegration.isDisplay(anchor)) {
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

            var form = $$.all('.work-item-form').filter(TfsIntegration.isDisplayBranch)[0];
            if (!form) {
                return;
            }

            var isNewView = !!$$('.new-work-item-view', form);
            var issueName, issueLink;

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
                    var issueId = issueIdRegExp[1];
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