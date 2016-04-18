module Integrations {

    class Trello implements WebToolIntegration {

        matchUrl = '*://trello.com/c/*';

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
            if (!match) {
                return;
            }

            // match[2] is a 'CARD_NUMBER' from path
            var issueId = match[2];
            if (!issueId) {
                return;
            }
            issueId = '#' + issueId;

            // <h2 class="window-title-text current hide-on-edit js-card-title">ISSUE_NAME</h2>
            var issueName = $$.try('.window-title h2').textContent;
            if (!issueName) {
                return;
            }

            //  <a class="board-header-btn board-header-btn-name js-rename-board" href="#">
            //    <span class="board-header-btn-text">Test Board</span>
            //  </a>
            var projectName = $$.try('.board-header-btn-name > .board-header-btn-text').textContent;

            var serviceType = 'Trello';

            var serviceUrl = source.protocol + source.host;

            var issueUrl = '/c/' + match[1];

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new Trello());
}