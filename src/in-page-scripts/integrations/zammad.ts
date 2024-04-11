class Zammad {

    showIssueId = true;

    matchUrl = /(.+:\/\/.+)(\/#ticket\/zoom\/(\d+))/;

    getIssue(_issueElement, source) {
        const issueName = $$.try('.ticket-title-update.js-objectTitle').textContent;
        if (!issueName) {
            return;
        }
        const match = this.matchUrl.exec(source.fullUrl);
        const issueId = $$.try('.ticket-number.js-objectNumber').textContent;
        const serviceUrl = match?.[1];
        const serviceType = 'Zammad';
        const issueUrl = match?.[2];
        const projectName = '';
        const tags = $$.all('.list.list--sidebar').map(label => label.children).pop();
        const tagNames = [] as (string | null | undefined)[];
        for (var i = 0; i < (tags?.length || 0); i++) {
            tagNames.push(tags?.item(i)?.textContent);
        }
        return {
            issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames
        } as WebToolIssue;
    }

    render(_issueElement, linkElement) {
        const host = $$('.buttonDropdown.dropdown.dropdown--actions.dropup');

        if (host) {
            linkElement.classList.add('zammad');
            linkElement.classList.add('tm-btn');
            linkElement.style.marginRight = 10 + 'px';
            host.insertAdjacentElement('beforebegin', linkElement);
        }
    }
}

IntegrationService.register(new Zammad());