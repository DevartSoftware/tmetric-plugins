module Integrations {

    const addTableRow = (table: HTMLElement, cellContent: HTMLElement) => {
        let tr = $$.create('tr');
        let td = $$.create('td');
        td.appendChild(cellContent);
        tr.appendChild(td);
        table.appendChild(tr);
    }

    class ZohoActivity implements WebToolIntegration {

        showIssueId = false;

        observeMutations = true;

        matchUrl = [
            "https://*/*portal/*/*.do*",
            "https://*/*crm/*.do*"
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
                addTableRow(table, linkElement);
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

            let urlRegexp = /^(.*)\/EntityInfo\.do\?(.+)/;
            let matches = source.fullUrl.match(urlRegexp); // Single activity page
            if (!matches) {
                let activityLinks = $$.all('li.ligraybackground #Subject');
                if (activityLinks.length == 1) {
                    let anchor = <HTMLAnchorElement>activityLinks[0].parentElement;
                    matches = (anchor.href || '').match(urlRegexp); // Activity list page
                }
            }

            if (matches) {
                let params = $$.searchParams(matches[2]);
                let issueType = params['module'];
                if (issueType) {
                    issueId = params['id'];
                }
                if (issueId) {
                    serviceType = 'ZohoCRM';
                    serviceUrl = matches[1];
                    issueUrl = `/EntityInfo.do?module=${issueType}&id=${issueId}`;
                }
            }

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
        }
    }

    class ZohoProject implements WebToolIntegration {

        showIssueId = false;

        observeMutations = true;

        matchUrl = '*://*/portal/*/bizwoheader.do*';

        textAreaSelector = 'textarea.taskedit, #tdetails_task textarea'; // tasks and issues

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            let table = $$.closest('table', $$(this.textAreaSelector));
            if (table) {
                linkElement.classList.add('addbtn', 'devart-timer-link-zoho-project');
                addTableRow(table, linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            let issueName = (<HTMLTextAreaElement>$$.try(this.textAreaSelector)).value;
            let projectName = $$.try('#taskprojname, #projectname').textContent;
            return { issueName, projectName };
        }
    }

    IntegrationService.register(new ZohoActivity(), new ZohoProject());
}