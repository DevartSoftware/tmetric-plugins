class Pipedrive implements WebToolIntegration {

    showIssueId: boolean;

    matchUrl = [
        '*://*.pipedrive.com/deal/*'
    ];

    observeMutations = true;

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        var issueId = source.path;
        var issueName = this.parseTitle(document.title) + " [" + this.parseId(source.path) + "]";
        var serviceUrl = source.protocol + source.host;
        var issueUrl = source.path;
        var projectName = 'sales';

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Pipedrive' };
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.mainmenu');
        if (host) {
            var container = $$.create('li');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }

    parseTitle(string) {
        var pos = string.lastIndexOf(" - ");
        return string.substring(0, pos);
    }

    parseId(string) {
        var pos = string.lastIndexOf("/");
        return string.substr(pos + 1);
    }
}

IntegrationService.register(new Pipedrive());