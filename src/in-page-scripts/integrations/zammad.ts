class Zammad {

    showIssueId = true;

    matchUrl = /(.+:\/\/.+)(\/#ticket\/zoom\/(\d+))/;

    getIssue(_issueElement, source) {
        let issueName = $$.try('.ticket-title-update.js-objectTitle').textContent;
        if (!issueName) {
            return;
        }
        const match = this.matchUrl.exec(source.fullUrl);
        let issueId = $$.try('.ticket-number.js-objectNumber').textContent;
        const serviceUrl = match[1];
        const serviceType = 'Zammad';
        let issueUrl = match[2];
        let projectName = '';
        let tags = $$.all('.list.list--sidebar').map(label => label.children).pop();
        const tagNames = [];
        for (var i = 0; i < tags.length; i++) {
            tagNames.push(tags.item(i).textContent);
        }
        return {
            issueId,
            issueName,
            projectName,
            serviceType,
            serviceUrl,
            issueUrl,
            tagNames
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