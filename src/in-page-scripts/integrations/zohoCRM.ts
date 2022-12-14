class ZohoActivity implements WebToolIntegration {

    showIssueId = true;

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

    showIssueId = true;

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

    issueElementSelector = [
        '.ticket-DVPanel',
        '.zd-ticketdetailview-container'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) { // Old version
            const panel = $$('#caseSubject', issueElement).parentElement.parentElement;
            panel?.insertBefore(linkElement, $$('.clboth', panel));
        } else if (issueElement.matches(this.issueElementSelector[1])) { // New version (2022)
            const panel = $$('.zd-secondrypanel-listItemContainer', issueElement);
            linkElement.style.marginLeft = '10px';
            panel?.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        const serviceType = 'ZohoCRM';

        if (issueElement.matches(this.issueElementSelector[0])) { // Old version
            const issueId = $$.try('#caseNum', issueElement).textContent;
            const issueName = $$.try('#caseSubjectText', issueElement).textContent;

            // https://desk.zoho.eu/support/mycompany/ShowHomePage.do#Cases/dv/80000000001234567
            const match = source.fullUrl.replace(/\?.+\#/, '#').match(/^(.+)\/(ShowHomePage\.do\#Cases\/dv\/\d+)$/i);
            const serviceUrl = match ? match[1] : null;
            const issueUrl = match ? match[2] : null;
            const projectName =
                $$.try('#crmpluscommonuiselecteddepartment', parent?.document).textContent ||
                $$.try('#dep_head').textContent;

            const tagNames = $$.all('.tagBody a', issueElement).map(_ => _.textContent);

            return { serviceType, serviceUrl, issueUrl, issueId, issueName, tagNames, projectName };
        }

        if (issueElement.matches(this.issueElementSelector[1])) { // New version (2022)
            const issueId = $$.try('.zd-ticketidwrapper-ticketId', issueElement).textContent;
            const issueName = $$.try('.zd-dvsubjectsection-subject', issueElement).textContent;

            // https://desk.zoho.eu/agent/mycompany/mydepartment/tickets/details/80000000001234567
            const match = source.fullUrl.match(/(.+:\/\/.+\/agent\/[^\/]+)(\/.+\/tickets\/details\/\d+)/);
            const serviceUrl = match?.[1];
            const issueUrl = match?.[2];
            const projectName = $$.try('.zd-departmentpopup-departmentPopup').textContent;

            const tagNames = $$.all('div[data-id="reqproperties"] .zd-tag-text').map(_ => _.textContent);

            return { serviceType, serviceUrl, issueUrl, issueId, issueName, tagNames, projectName };
        }
    }
}

IntegrationService.register(new ZohoActivity(), new ZohoProject(), new ZohoDesk());