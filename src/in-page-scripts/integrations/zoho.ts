module Integrations {

    class Zoho implements WebToolIntegration {

        showIssueId = false;

        observeMutations = true;

        matchUrl = '*/EntityInfo.do*';

        issueElementSelector = '#flw_div table.floatR';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            let container = $$.create('a');
            container.className = 'newgreybtn newbutton dIB';
            container.appendChild(linkElement);

            let tdForInsert: Element;

            if (issueElement.querySelectorAll('tr').length == 1) {
                tdForInsert = issueElement.querySelector('tr td');
            } else if (issueElement.querySelectorAll('tr').length >= 2) {
                tdForInsert = issueElement.querySelector('tr:nth-child(2) td');
            }

            if (tdForInsert.firstElementChild && !tdForInsert.firstElementChild.textContent.length) {
                tdForInsert.firstElementChild.remove()
            }

            tdForInsert.insertBefore(container, tdForInsert.firstElementChild);
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            let contactName = $$.try('#value_CONTACTID');
            let issueName = $$.try('#headervalue_SUBJECT, #entityNameInBCView').textContent;

            if (Object.keys(contactName).length && contactName.textContent) {
                let text = contactName.textContent;
                issueName = `${$$.try('#headervalue_SUBJECT').textContent} ${text.trim().length ? `- ${text}` : ''}`;
            }

            let issueId = source.fullUrl.match(/(?:id=(\d+))/)[1];
            let matches = source.fullUrl.match(/^(.*)(EntityInfo.*)$/);

            let [serviceUrl, issueUrl] = [matches[1], matches[2]]
            let projectName = null;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Zoho' };
        }
    }

    IntegrationService.register(new Zoho());
}