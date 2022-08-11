class Slack implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://app.slack.com/*';

    issueElementSelector = '.c-message_actions__container';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        const actionsGroup = $$('.c-message_actions__group', issueElement);

        if (actionsGroup) {
            linkElement.classList.add('devart-timer-link-slack', 'c-button-unstyled', 'c-icon_button', 'c-icon_button--size_small', 'c-message_actions__button');
            actionsGroup.lastChild.before(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        console.log('getIssue');

        let issueName = $$.try('.c-message_kit__blocks .p-rich_text_section', issueElement.parentElement)?.textContent?.trim();
        if (!issueName) {
            return;
        }

        let projectName = $$.try('.p-view_header__channel_title').textContent;

        const serviceUrl = source.protocol + source.host

        return { issueName, projectName, serviceUrl, serviceType: 'Slack' }
    }
}

IntegrationService.register(new Slack());