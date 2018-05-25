class ZohoActivity implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = [
        "https://*/*portal/*/*.do*",
        "https://*/*crm/*"
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        let table = $$('.historycontainer table.floatR');
        if (!table) {
            return;
        }

        linkElement.classList.add('newwhitebtn', 'dIB');
        let button = $$.visible('.newbutton', table);

        if (button) {
            button.parentElement.insertBefore(linkElement, button);
        } else {
            let tr = $$.create('tr');
            let td = $$.create('td');
            td.appendChild(linkElement);
            tr.appendChild(td);
            table.appendChild(tr);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('#subvalue_SUBJECT, #entityNameInBCView').textContent;
        if (!issueName) {
            return;
        }

        let contactName = $$.try('#subvalue_CONTACTID').textContent;
        if (contactName) {
            issueName += ` - ${contactName}`;
        }

        let projectName: string;
        let serviceUrl: string;
        let issueUrl: string;
        let issueId: string;
        let serviceType: string;

        let urlRegexp = /^(.*)\/crm\/tab\/Activities\/(\d+)/;
        let matches = source.fullUrl.match(urlRegexp); // Single activity page
        if (!matches) {
            let activityLinks = $$.all('li.ligraybackground #Subject');
            if (activityLinks.length == 1) {
                let anchor = <HTMLAnchorElement>activityLinks[0].parentElement;
                matches = (anchor.href || '').match(urlRegexp); // Activity list page
            }
        }

        if (matches) {
            serviceType = 'ZohoCRM';
            serviceUrl = matches[1];
            issueId = matches[2];
            issueUrl = `/crm/tab/Activities/${issueId}`;
        }

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
    }
}

class ZohoProject implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://*/portal/*/bizwoheader.do*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let panel = $$('.detail-updates');
        if (panel) {
            linkElement.classList.add('devart-timer-link-zoho-project');
            panel.insertBefore(linkElement, panel.lastElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        let issueName = (<HTMLTextAreaElement>$$.try('textarea.taskedit, #tdetails_task textarea')).value // tasks
            || (<HTMLTextAreaElement>$$.try('textarea.detail-tsktitle')).value; // issues

        let projectName = $$.try('.detail-hierarchy a').textContent // issues
            || $$.try('.detail-hierarchy span > span').textContent; // tasks

        return { issueName, projectName };
    }
}

IntegrationService.register(new ZohoActivity(), new ZohoProject());