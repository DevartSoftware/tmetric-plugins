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
            var issueUrl: string;

            if (isNewView) {
                // route for the new TFS interface
                var issueInput = $$.visible<HTMLInputElement>('.work-item-form-title input', form);
                if (issueInput) {
                    issueName = issueInput.value;
                }
                issueUrl = $$.getAttribute('.info-text-wrapper a', 'href');
            }
            else {
                issueName = $$.try('.workitem-info-bar').title;
                issueUrl = $$.getAttribute('.workitem-info-bar a', 'href');
            }

            if (!issueName) {
                // nothing to do without issue name
                return;
            }

            if (issueUrl) {
                // _workitems/edit/1
                // _workitems/edit/1?fullScreen=false
                var issueIdRegExp = /\/edit\/(\d*)(\?.*)?$/.exec(issueUrl);
                if (issueIdRegExp) {
                    var issueId = '#' + issueIdRegExp[1];
                }
                else {
                    issueUrl = null;
                }
            }

            var projectName = $$.try('.header-item.project-selector-nav-menu > li > span').textContent;

            // https://devart.visualstudio.com/
            var serviceUrl = source.protocol + source.host;

            var serviceType = 'TFS';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new TfsIntegration());
}