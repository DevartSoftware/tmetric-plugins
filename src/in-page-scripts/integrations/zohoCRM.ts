class ZohoActivity implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = [
        "https://*/*portal/*/*.do*",
        "https://*/*crm/*"
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        linkElement.classList.add('newwhitebtn', 'dIB');

        const eventInfoTable = $$('.eventInfo table');
        if (eventInfoTable) {
            linkElement.classList.add('floatR');
            const td = $$('td', eventInfoTable);
            if (td) {
                td.prepend(linkElement);
            }
            return;
        }

        const table = $$('.historycontainer table.floatR');
        if (table) {
            const tr = $$.create('tr');
            const td = $$.create('td');
            td.appendChild(linkElement);
            tr.appendChild(td);
            const tbody = $$('tbody', table);
            if (tbody) {
                tbody.appendChild(tr);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('#subvalue_SUBJECT, #entityNameInBCView').textContent;
        if (!issueName) {
            return;
        }

        const contactName = $$.try('#subvalue_CONTACTID').textContent;
        if (contactName) {
            issueName += ` - ${contactName}`;
        }

        let projectName: string;
        let issueUrl: string;
        let issueId: string;

        const urlRegexp = /^(.*)\/crm\/([^\/]+\/)?tab\/Activities\/(\d+)/;
        let matches = source.fullUrl.match(urlRegexp); // Single activity page
        if (!matches) {
            const activityLinks = $$.all('li.ligraybackground #Subject');
            if (activityLinks.length == 1) {
                const anchor = <HTMLAnchorElement>activityLinks[0].parentElement;
                matches = (anchor.href || '').match(urlRegexp); // Activity list page
            }
        }

        if (matches) {
            issueId = matches[3] || matches[2];
            issueUrl = `/crm/tab/Activities/${issueId}`;
        }

        const matchUrl = source.fullUrl.match('^(.+)\/(?:crm|portal)\/.+');
        const serviceUrl = matchUrl[1];

        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'ZohoCRM' };
    }
}

class ZohoProject implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://*/portal/*/bizwoheader.do*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const panel = $$('.detail-updates');
        if (panel) {
            linkElement.classList.add('devart-timer-link-zoho-project');
            panel.insertBefore(linkElement, panel.lastElementChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        const issueName = (<HTMLTextAreaElement>$$.try('textarea.taskedit, #tdetails_task textarea')).value // tasks
            || (<HTMLTextAreaElement>$$.try('textarea.detail-tsktitle')).value; // issues

        const projectName = $$.try('.detail-hierarchy a').textContent // issues
            || $$.try('.detail-hierarchy span > span').textContent // tasks
            || $$.try('.topband_projsel [id^="projlink_"]').textContent; // project in header

        return { issueName, projectName };
    }
}

class ZohoDesk implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    issueElementSelector = '.ticket-DVPanel';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const panel = $$('#caseSubject', issueElement).parentElement.parentElement;
        if (panel) {
            panel.insertBefore(linkElement, $$('.clboth', panel));
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueId = $$.try('#caseNum', issueElement).textContent;
        const issueName = $$.try('#caseSubjectText', issueElement).textContent;

        const match = source.fullUrl.replace(/\?.+\#/, '#').match(/^(.+)\/(ShowHomePage\.do\#Cases\/dv\/\d+)$/i);
        const serviceUrl = match ? match[1] : null;
        const issueUrl = match ? match[2] : null;

        const tagNames = $$.all('.tagBody a', issueElement).map(_ => _.textContent);

        return { serviceType: 'ZohoCRM', serviceUrl, issueUrl, issueId, issueName, tagNames };
    }

}

IntegrationService.register(new ZohoActivity(), new ZohoProject(), new ZohoDesk());