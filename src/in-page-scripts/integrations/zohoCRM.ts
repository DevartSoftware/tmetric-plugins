module Integrations {

    class ZohoActivity implements WebToolIntegration {

        showIssueId = false;

        observeMutations = true;

        matchUrl = '*/EntityInfo.do*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let table = $$('.historycontainer table.floatR');
            if (!table) {
                return;
            }

            linkElement.classList.add('newwhitebtn', 'dIB');
            let button = $$('.newbutton', table);

            if (button) {
                button.parentElement.insertBefore(linkElement, button);
                return;
            }

            let tr = $$.create('tr');
            let td = $$.create('td');
            td.appendChild(linkElement);
            tr.appendChild(td);
            table.appendChild(tr);
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

            let matches = source.fullUrl.match(/^(.*)\/EntityInfo.*\?(.+)/);
            if (matches) {
                let params = $$.searchParams(matches[2]);
                let module = params['module'];
                if (module) {
                    issueId = params['id'];
                }
                if (issueId) {
                    serviceType = 'ZohoCRM';
                    serviceUrl = matches[1];
                    issueUrl = `/EntityInfo.do?module=${module}&id=${issueId}`;
                }
            }

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
        }
    }

    class ZohoProject implements WebToolIntegration {

        showIssueId = false;

        observeMutations = true;

        //'*://*/portal/*/bizwoheader.do*'
        matchUrl = '*://*/portal/*/bizwoheader.do*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            let projectTaskDetails = document.querySelector('#tdetails_task');

            if (projectTaskDetails) {
                let table = projectTaskDetails.querySelector('table.txtSmall table');
                if (table) {
                    // adding classes from zoho
                    // fr = float:rigft, pt10 = padding-top: 10, mR10 = margin-right: 10
                    linkElement.classList.add('fr', 'pt10', 'mR10');
                    table.querySelector('tr td').appendChild(linkElement);
                }
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.taskDescRow .taskViewSels').textContent;

            if (!issueName) {
                return;
            }

            let contactName = $$.try('#subvalue_CONTACTID').textContent;
            if (contactName) {
                issueName += ` - ${contactName}`;
            }

            let projectName: string;
            let issueUrl: string;
            let issueId: string;
            let serviceType = 'ZohoCRM';

            let serviceUrl = source.protocol + source.host;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
        }
    }

    IntegrationService.register(new ZohoActivity());
    IntegrationService.register(new ZohoProject());
}