module Integrations {

    class Trello implements WebToolIntegration {

        matchUrl = '*://trello.com/c/*';

        match(source: Source): boolean {
            var descriptionMeta = $$('meta[name=description]');
            if (descriptionMeta) {
                return descriptionMeta.getAttribute('content').indexOf('Trello') >= 0;
            }
            return false;
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.js-plugin-buttons ~ .window-module > div');
            if (host) {
                linkElement.classList.add('trello');
                linkElement.classList.add('button-link');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            // Full card url:
            // https://trello.com/c/CARD_ID/CARD_NUMBER-CARD_TITLE_DASHED_AND_LOWERCASED
            // Effective card url:
            // https://trello.com/c/CARD_ID

            var match = /^\/c\/(.+)\/(\d+)-(.+)$/.exec(source.path);

            var result;

            if (match) {
                var issueId, issueName, projectName, serviceType, serviceUrl, issueUrl;

                // match[1] is a 'CARD_NUMBER' from path
                issueId = match[2];
                if (!issueId) {
                    return;
                }

                issueId = '#' + issueId;

                // <h2 class="window-title-text current hide-on-edit js-card-title">ISSUE_NAME</h2>
                issueName = $$.try('.window-title-text').textContent;
                if (!issueName) {
                    return;
                }
                issueName = issueName.trim();

                //  <a class="board-header-btn board-header-btn-name js-rename-board" href="#">
                //    <span class="board-header-btn-text">Test Board</span>
                //  </a>
                projectName = $$.try('.board-header-btn-text').textContent;
                if (projectName) {
                    projectName = projectName.trim();
                }

                serviceType = 'Trello';

                serviceUrl = source.protocol + source.host;

                issueUrl = '/c/' + match[1];

                result = { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
            }

            return result;
        }
    }

    IntegrationService.register(new Trello());
}