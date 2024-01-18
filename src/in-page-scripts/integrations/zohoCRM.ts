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

    getIssue(issueElement: HTMLElement, _source: Source) {

        let issueName = $$.try('#subvalue_SUBJECT, #entityNameInBCView', issueElement).textContent; // 1) task or call; 2) event
        if (!issueName) {
            return;
        }

        const contactName = $$.try('#subvalue_CONTACTID', issueElement).textContent;
        if (contactName) {
            issueName += ` - ${contactName}`;
        }

        const tagNames = $$.all('.linktoTagA', issueElement).map(_ => _.textContent);
        const serviceType = 'ZohoCRM';

        return {
            serviceType, issueName, tagNames
        } as WebToolIssue;
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

    getIssue(issueElement: HTMLElement, source: Source) {

        const issueName = $$.try('.detail-title-plain', issueElement).textContent;

        const projectName = $$.try('.entity-project > span', issueElement).textContent // tasks
            || $$.try('.entity-project > a').textContent; // issues

        const tagNames = $$.all('.zptagslist > span', issueElement).map(_ => _.textContent);
        const serviceType = 'ZohoCRM';

        return {
            serviceType, issueName, projectName, tagNames
        } as WebToolIssue;
    }
}

class ZohoDesk implements WebToolIntegration {

    showIssueId = true;

    issueElementSelector = [
        '.ticket-DVPanel', // before 2022
        '.zd-ticketdetailview-container', // 2022
        '.zd_v2-ticketdetailview-container' // 2023
    ];

    private getCssPrefix(issueElement: HTMLElement) {
        const isV2 = issueElement.matches(this.issueElementSelector[2]);
        return isV2 ? '.zd_v2-' : '.zd-';
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.matches(this.issueElementSelector[0])) { // Old version
            const panel = $$('#caseSubject', issueElement).parentElement.parentElement;
            panel?.insertBefore(linkElement, $$('.clboth', panel));
        } else { // New version (2022+)
            const prefix = this.getCssPrefix(issueElement);
            const panel = $$(prefix + 'secondrypanel-listItemContainer', issueElement);
            linkElement.style.marginLeft = '10px';
            panel?.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        const serviceType = 'ZohoCRM';

        if (issueElement.matches(this.issueElementSelector[0])) { // Old version
            const issueId = $$.try('#caseNum', issueElement).textContent;
            const issueName = $$.try('#caseSubjectText', issueElement).textContent;

            // https://desk.zoho.eu/support/mycompany/ShowHomePage.do#Cases/dv/80000000001234567
            const match = source.fullUrl.replace(/\?.+\#/, '#').match(/^(.+)\/(ShowHomePage\.do\#Cases\/dv\/\d+)$/i);
            const serviceUrl = match ? match[1] : null;
            const issueUrl = match ? match[2] : null;
            let projectName = $$.try('#dep_head').textContent;
            if (!projectName) {
                try {
                    projectName = $$.try('#crmpluscommonuiselecteddepartment', parent?.document).textContent;
                }
                catch (e) {
                    // ignore cross-origin frame blocking (TMET-8600)
                }
            }

            const tagNames = $$.all('.tagBody a', issueElement).map(_ => _.textContent);

            return {
                serviceType, serviceUrl, issueUrl, issueId, issueName, tagNames, projectName
            } as WebToolIssue;
        } else { // New version (2022+)
            const prefix = this.getCssPrefix(issueElement);
            const issueId = $$.try(prefix + 'ticketidwrapper-ticketId', issueElement).textContent;
            const issueName = $$.try(prefix + 'dvsubjectsection-subject', issueElement).textContent;

            // https://desk.zoho.eu/agent/mycompany/mydepartment/tickets/details/80000000001234567
            const match = source.fullUrl.match(/(.+:\/\/.+\/agent\/[^\/]+)(\/.+\/tickets\/details\/\d+)/);
            const serviceUrl = match?.[1];
            const issueUrl = match?.[2];
            const projectName = $$.try(prefix + 'departmentpopup-departmentPopup').textContent;

            const tagNames = $$.all(`div[data-id="reqproperties"] ${prefix}tag-text`).map(_ => _.textContent);

            return {
                serviceType, serviceUrl, issueUrl, issueId, issueName, tagNames, projectName
            } as WebToolIssue;
        }
    }
}

IntegrationService.register(new ZohoActivity(), new ZohoProject(), new ZohoDesk());
