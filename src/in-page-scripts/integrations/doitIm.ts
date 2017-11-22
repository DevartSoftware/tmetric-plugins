class DoitImTask implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://i.doit.im/home/#/task/*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let toolbar = $$('li.task-op', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn-4');
            toolbar.insertBefore(linkElement, toolbar.firstChild);
        }

    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('#task_container span.title').textContent;
        if (!issueName) {
            return;
        }

        let issueUrl: string;
        let issueId: string;

        let matches = source.fullUrl.match(/\/home\/#\/task\/([a-z0-9\-])+/);

        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;
        
        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'DoitIm' };
    }
}

class DoitImProject implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://i.doit.im/home/#/project/*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let toolbar = $$('li.project-op', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn-4');
            toolbar.insertBefore(linkElement, toolbar.firstChild);
        }

    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('#project_info span.title').textContent;
        if (!issueName) {
            return;
        }

        let issueUrl: string;
        let issueId: string;

        let matches = source.fullUrl.match(/\/home\/#\/project\/([a-z0-9\-])+/);

        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'DoitIm' };
    }
}

class DoitImGoal implements WebToolIntegration {

    showIssueId = false;

    matchUrl = 'https://i.doit.im/home/#/goal/*';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let toolbar = $$('li.goal-op', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn-4');
            toolbar.insertBefore(linkElement, toolbar.firstChild);
        }

    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('#goal_info span.title').textContent;
        if (!issueName) {
            return;
        }

        let issueUrl: string;
        let issueId: string;

        let matches = source.fullUrl.match(/\/home\/#\/goal\/([a-z0-9\-])+/);

        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'DoitIm' };
    }
}

IntegrationService.register(new DoitImTask(), new DoitImProject(), new DoitImGoal());