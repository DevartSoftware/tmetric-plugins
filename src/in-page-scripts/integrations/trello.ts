class Trello implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://trello.com/c/*';

    issueElementSelectorForCheck = [
        '[data-testid="card-back-copy-card-button"]', // issue card for logged-in user
        '[data-testid="card-back-mirror-card-button"]', // issue card for logged-out user
        '[data-testid="check-item-name"]'
    ];

    issueElementSelector = () => {

        let element = $$(this.issueElementSelectorForCheck[0])?.parentElement?.parentElement || null;
        if (!element) {
            element = $$(this.issueElementSelectorForCheck[1])?.parentElement?.parentElement?.parentElement || null;
        }

        return [
            $$.visible(this.issueElementSelectorForCheck[2]),
            element
        ];
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if ($$(this.issueElementSelectorForCheck[0], issueElement) || $$(this.issueElementSelectorForCheck[1], issueElement)) {
            // cut 'timer' so that time can be visible if we have time
            const text = linkElement.lastElementChild!.textContent;
            if (/[0-9]/.test(text!)) {
                linkElement.lastElementChild!.textContent = text!.replace(' timer', '');
            }

            const moveCardButton = $$('[data-testid="card-back-move-card-button"]', issueElement) ||
                $$(this.issueElementSelectorForCheck[0], issueElement) ||
                $$(this.issueElementSelectorForCheck[1], issueElement);

            if (moveCardButton) {
                const moveCardButtonLi = moveCardButton.closest('li');

                const buttonClasses = Array.from(moveCardButton.classList);

                buttonClasses.forEach(className => {
                    linkElement.classList.add(className);
                    linkElement.classList.add('devart-timer-link-trello');
                });

                const newLi = document.createElement('li');

                newLi.appendChild(linkElement);

                if (moveCardButtonLi) {
                    issueElement.prepend(newLi);
                }
            }
        } else if (issueElement.matches(this.issueElementSelectorForCheck[2])) { // for checklist

            linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-trello');

            let element = $$('[data-testid="check-item-set-due-button"]', issueElement);

            if (element) {
                element.parentElement!.insertBefore(linkElement, element);
            }
            else {
                element = $$('[data-testid="check-item-hover-buttons"]', issueElement);

                if (element) {
                    element.appendChild(linkElement);
                }
            }            
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Trello';

        // full card url:
        // https://trello.com/c/CARD_ID/CARD_NUMBER-CARD_TITLE_DASHED_AND_LOWERCASED
        // effective card url:
        // https://trello.com/c/CARD_ID
        const urlRegex = /^\/c\/(.+)\/(\d+)-(.+)$/;
        let match = urlRegex.exec(source.path);
        if (!match) {
            // read the value from the meta tag that we fill in trello-embed.ts (TMET-10682)
            const meta = $$<HTMLMetaElement>('head > meta[name=tmetric-issue-url]');
            const url = serviceUrl + source.path.replace(/\/*$/, '/'); // append a single slash
            if (meta?.content?.startsWith(url)) {
                const path = meta.content.substring(serviceUrl.length);
                match = urlRegex.exec(path);
            } else {
                meta && document.head.removeChild(meta);
                const newMeta = document.createElement('meta');
                newMeta.name = 'tmetric-issue-url';
                newMeta.content = '';
                document.head.appendChild(newMeta);
            }
            if (!match) {
                return;
            }
        }

        // match[2] is a 'CARD_NUMBER' from path
        let issueId = match[2];
        if (!issueId) {
            return;
        }
        issueId = '#' + issueId;

        // <h2 class="window-title-text current hide-on-edit js-card-title">ISSUE_NAME</h2>
        const issueName = $$.try('#card-back-name').textContent;
        if (!issueName) {
            return;
        }

        const projectName = $$.try('.board-header h1[data-testid=board-name-display]').textContent;

        const issueUrl = '/c/' + match[1];

        const tagNames = $$.all('span[data-testid="card-label"]').map(label => label.textContent);

        let description: string | undefined | null;
        if (issueElement.matches(this.issueElementSelectorForCheck[2])) {
            description = issueElement.childNodes[0].textContent;
        }

        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames, description
        } as WebToolIssue;
    }
}

IntegrationService.register(new Trello());