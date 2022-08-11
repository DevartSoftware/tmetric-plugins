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

        let issueName = (<any>$$.try('.c-message_kit__blocks .p-rich_text_section', issueElement.parentElement)).textContent?.trim();
        if (!issueName) {
            return;
        }

        let issueId = $$.getAttribute('a.c-link.c-timestamp', 'data-ts', issueElement.parentElement);
        let issueUrl = `${source.path}/${issueId}`;

        let projectName = (<any>$$.try('.p-view_header__channel_title')).textContent;

        const serviceUrl = source.protocol + source.host

        return { issueId, issueName, projectName, issueUrl, serviceUrl, serviceType: 'Slack' }
    }
}

IntegrationService.register(new Slack());