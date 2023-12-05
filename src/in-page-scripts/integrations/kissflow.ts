class Kissflow implements WebToolIntegration {

    /**
     * The array of URLs (with wildcards) that are used to identify
     * pages as those that belong to the service.
     */
    matchUrl = [
        '*://*.kissflow.com/*'
    ];

    issueElementSelector = [
        '[class*="formRightSide"]',     // SubItem
        '[class*="rightSideLayout"]',   // Item
    ];

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // Currently only coded for Kissflow Boards
        // Kissflow board item full url:
        // https://[subdomain].kissflow.com/view/case/[board_id]/form/[item_id]
        // Kissflow board sub-item full url:
        // https://[subdomain].kissflow.com/view/case/[board_id]/form/[item_id]/subitem/[subitem_id]
        const matchMainItem = /^\/view\/case\/([^\/]+)\/form\/([^\/]+)\/?$/.exec(source.path);
        const matchSubItem = /^\/view\/case\/([^\/]+)\/form\/([^\/]+)\/subitem\/([^\/]+)\/?$/.exec(source.path);


        let issueId = ''
        let projectName = ''
        let issueUrl = ''
        let issueName = ''
        if (matchMainItem) {

            issueId = matchMainItem[2]
            issueUrl = matchMainItem[0]
            projectName = matchMainItem[1]

            // Getting the textContent if the element exists
            issueName = $$.try('[class*="formTitleText"] span').textContent;

        } else if (matchSubItem) {

            issueId = `${matchSubItem[2]}/subitem/${matchSubItem[3]}`
            issueUrl = matchSubItem[0]
            projectName = matchSubItem[1]

            // Getting the textContent if the element exists
            issueName = $$.try('[class*="formTitleText"] span').textContent;

        } else {
            return;
        }

        const serviceUrl = source.protocol + source.host;

        // Return an object with the task properties
        return {
            issueId,
            issueName,
            projectName,
            serviceType: 'Kissflow',
            serviceUrl,
            issueUrl
        };
    }

    /**
     * Inserts the timer button for the identified issue into a Web page.
     */
    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        linkElement.classList.add('button--3c33a8f8', 'primary--428c90ce');
        const referenceElement = issueElement.className.includes('rightSideLayout') ?
            $$('#AssignedTo', issueElement) :
            $$('[class*="systemField"]', issueElement)?.nextSibling;
        referenceElement?.parentNode.insertBefore(linkElement, referenceElement);
    }
}

IntegrationService.register(new Kissflow());