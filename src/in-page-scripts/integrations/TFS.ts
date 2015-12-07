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
                anchor = $$.visible('.work-item-form .work-item-form-id', form);
            } else {
                anchor = $$.visible('.workitem-tool-bar .menu-bar', form);
            }

            if (!anchor) {
                return;
            }

            if (isNewView) {
                var linkContainer = $$.create('div', 'devart-timer-link-tfs');
                linkContainer.classList.add('workitemcontrol');
                linkContainer.classList.add('work-item-control');
                linkContainer.appendChild(linkElement);
                anchor.parentElement.insertBefore(linkContainer, anchor.parentElement.firstElementChild);
            } else {
                var linkContainer = $$.create('li');
                linkContainer.classList.add('menu-item');
                linkContainer.appendChild(linkElement);
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
                var input = <HTMLInputElement>$$.visible('.work-item-form-title input', form);
                if (input) {
                    issueName = input.value;
                }
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