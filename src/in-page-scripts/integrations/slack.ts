class Slack implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://app.slack.com/*';

    issueElementSelector = '.c-message_actions__container';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        const actionsGroup = $$('.c-message_actions__group', issueElement);

        if (actionsGroup) {
            linkElement.classList.add('devart-timer-link-slack', 'c-button-unstyled', 'c-icon_button', 'c-icon_button--size_small', 'c-message_actions__button');
            actionsGroup.lastChild?.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {
        let issueName;
        const getTextElement = (node: Node) => {
            let text = '';
            if (node.childNodes?.length) {
                text = Array.from(node.childNodes)
                    .filter(node => !(node instanceof Element && (<Element>node).classList.contains('c-message__edited_label')))
                    .reduce((sumText, childNode) => {
                        let elText = getTextElement(childNode);
                        if (elText[0] == ' ' && sumText[sumText.length - 1] == ' ') {
                            elText = text.substring(1);
                        }
                        return sumText + elText;
                    }, '');
            } else {
                text = `${node.textContent?.trim()} `;
            }

            return text;
        };

        const messageBlock = $$('.c-message_kit__blocks .p-rich_text_block', issueElement.parentElement);
        if (messageBlock?.childNodes) {
            issueName = Array.from(messageBlock.childNodes)
                .reduce((sumText, node) => sumText + getTextElement(node), '')
                .trim();
        }

        if (!issueName) {
            return;
        }

        const projectName = $$.try('.p-view_header__channel_title').textContent;

        const serviceUrl = source.protocol + source.host
        const serviceType = 'Slack';

        return {
            issueName, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new Slack());