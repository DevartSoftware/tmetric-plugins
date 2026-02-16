class Bitrix24 implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://*/*/tasks/task/view/*'; // url of iframe for the existed task

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        const title = $$('.tasks-field-title');
        if (title) {
            linkElement.classList.add('devart-timer-link-bitrix24')
            title.parentNode?.insertBefore(linkElement, title.nextSibling);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        let issueName = $$<HTMLTextAreaElement>('.tasks-field-title > textarea')?.value ||
            $$('.tasks-field-title')?.getAttribute('data-task-field-value');

        if (!issueName) {
            return;
        }

        let issueUrl: string | undefined;
        let issueId: string | undefined;

        const matches = source.fullUrl.match(/(?:company|workgroups)\/.*\/task\/view\/(\d+)/);

        if (matches) {
            issueId = matches[1];
            issueUrl = '/company/personal/user/0/tasks/task/view/' + issueId + '/';
        }

        const serviceUrl = source.protocol + source.host;
        const serviceType = 'Bitrix24';

        const projectName = $$.try('.tasks-field-group-title').textContent;

        return {
            issueId, issueName, issueUrl, serviceUrl, projectName, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new Bitrix24());