class Zammad {

    showIssueId = true;
    observeMutations = true;
    matchUrl = /(.+:\/\/.+)(\/#ticket\/zoom\/(\d+))/;

    getIssue(issueElement, source) {
        let issueName = $$.try('.ticket-title-update.js-objectTitle').textContent;
        if (!issueName) {
            return;
        }
        let match = this.matchUrl.exec(source.fullUrl);
        let issueId = $$.try('.ticket-number.js-objectNumber').textContent;
        let serviceUrl = match[1];
        let issueUrl = match[2];
        let projectName = '';
        let tags = $$.all('.list.list--sidebar').map(label => label.children).pop();
        let tagNames = [];
        for (var i = 0; i < tags.length; i++) {
            tagNames.push(tags.item(i).textContent);
        }
        return {
            issueId,
            issueName,
            projectName,
            serviceType: 'Zammad',
            serviceUrl,
            issueUrl,
            tagNames
        };
    }

    render(issueElement, linkElement) {
        let host = $$('.buttonDropdown.dropdown.dropdown--actions.dropup');

        if (host) {
            linkElement.classList.add('zammad');
            linkElement.classList.add('tm-btn');
            linkElement.style.marginRight = 10 + 'px';
            host.insertAdjacentElement('beforebegin', linkElement);
        }
    }
}

IntegrationService.register(new Zammad());