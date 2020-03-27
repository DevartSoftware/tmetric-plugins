class Trello implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://trello.com/c/*';

    issueElementSelector = [
        '.js-plugin-buttons ~ .window-module > div',
        '.checklist-item-details'
    ];

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) {
            // cut 'timer' so that time can be visible if we have time
            let text = linkElement.lastElementChild.textContent;
            if (/[0-9]/.test(text)) {
                linkElement.lastElementChild.textContent = text.replace(' timer', '');
            }
            linkElement.classList.add('trello');
            linkElement.classList.add('button-link');
            issueElement.insertBefore(linkElement, issueElement.firstElementChild);
        } else if (issueElement.matches(this.issueElementSelector[1])) { // for checklist
            let wrapper = $$('.checklist-item-controls', issueElement);
            if (wrapper) {
                linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-trello');
                wrapper.appendChild(linkElement);
            }
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
        var projectName = $$.try('.board-header-btn > .board-header-btn-text').textContent;

        var serviceUrl = source.protocol + source.host;

        var issueUrl = '/c/' + match[1];

        var tagNames = $$.all('.js-card-detail-labels-list .card-label').map(label => label.textContent);

        let description: string;

        if (issueElement.matches(this.issueElementSelector[1])) {
            description = $$.try('.checklist-item-details-text', issueElement).textContent;
        }

        return { issueId, issueName, projectName, serviceType: 'Trello', serviceUrl, issueUrl, tagNames, description };
    }
}

IntegrationService.register(new Trello());