class ZohoActivity implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = [
        "https://*/*portal/*/*.do*",
        "https://*/*crm/*"
    ];

    issueElementSelector = '#kventitydetailspage, .task-detailview'; // 1) kanban view; 2) list view

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        linkElement.classList.add('newwhitebtn', 'dIB', 'mR0');

        const eventInfoTable = $$('.eventInfo table', issueElement);
        if (eventInfoTable) {
            linkElement.classList.add('floatR');
            const td = $$('td', eventInfoTable);
            if (td) {
                td.prepend(linkElement);
            }
            return;
        }

        const table = $$('.historycontainer table', issueElement);
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

        let issueName = $$.try('#subvalue_SUBJECT, #entityNameInBCView', issueElement).textContent; // 1) task or call; 2) event
        if (!issueName) {
            return;
        }

        const contactName = $$.try('#subvalue_CONTACTID', issueElement).textContent;
        if (contactName) {
            issueName += ` - ${contactName}`;
        }

        const tagNames = $$.all('.linktoTagA', issueElement).map(_ => _.textContent);

        return { serviceType: 'ZohoCRM', issueName, tagNames };
    }
}

class ZohoProject implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://*/portal/*';

    issueElementSelector = '#zpsDetailView .detail_rhs';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        const panel = $$('#headerIconSection');
        if (panel) {
            panel.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const issueName = $$.try('.detail-title-plain', issueElement).textContent;

        const projectName = $$.try('.entity-project > span', issueElement).textContent // tasks
            || $$.try('.entity-project > a').textContent; // issues

        const tagNames = $$.all('.zptagslist > span', issueElement).map(_ => _.textContent);

        return { serviceType: 'ZohoCRM', issueName, projectName, tagNames };
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