module Integrations {

    class ZohoCRM implements WebToolIntegration {

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

    IntegrationService.register(new ZohoCRM());
}