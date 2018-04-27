class Megaplan implements WebToolIntegration {

    showIssueId = false;
    observeMutations = true;
    matchUrl = '*.megaplan.*/task/*/card';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        var host = $$.try('.Qivm8UCnb7wWemT0-UqI3').closest('div._1XKpckMR-iqskJqYp7ANvs');

        if (host) {
            let container = $$.create('span', '_2AE_SmHSAzvfT9PloTtatR');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('._3DaSNaNqBFWa3mWbFWicFI').textContent;

        let issueNumber = source.path.split('/')[2];
        if (!issueNumber) {
            return;
        }

        let issueId = '#' + issueNumber;

        let projectName = $$.try('._3bCrSGVnXH5AUbZRlD6TbT').textContent;

        let serviceUrl = source.protocol + source.host;
        let issueUrl = `task/${issueNumber}/card/`;
        let tagNames = $$.all('[data-element="attachedTag"]', issueElement).map(label => label.textContent);

        return { issueId, issueName, projectName, serviceType: 'Megaplan', serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new Megaplan());