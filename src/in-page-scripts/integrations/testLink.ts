module Integrations {

    class TestLink implements WebToolIntegration {

        matchUrl = '*/lib/execute/*.php*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            var host = $$('.groupBtn');
            if (host) {
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement2: HTMLElement, source: Source): WebToolIssue {

            let titleNode = $$('.exec_tc_title');
            if (!titleNode) {
                return;
            }

            let issueId = '';
            let issueName = '';

            let i = 0;

            while (i < titleNode.childNodes.length) {
                let childNode = titleNode.childNodes[i];
                i++;
                if (childNode.nodeName == '#text') {

                    // nodeValue = '    Test Case ID tmet-1234:: Version: 1		'
                    let match = /\s+([^\s]+\-[\d]+)\s*\:\:/.exec(childNode.nodeValue);
                    if (match) {
                        issueId = match[1]; // tmet-123
                        break;
                    }
                }
            }

            if (!issueId) {
                return;
            }

            while (i < titleNode.childNodes.length) {
                let childNode = titleNode.childNodes[i];
                i++;
                if (childNode.nodeName == '#text') {
                    issueName = childNode.nodeValue.trim();
                    break;
                }
            }

            if (!issueName) {
                return;
            }

            // http(s)://testlink.company.local/lib/execute/...
            let serviceUrl = source.fullUrl.split('/lib/execute/')[0];

            let issueUrl = `/lib/testcases/archiveData.php?targetTestCase=${issueId}&edit=testcase`;

            let projectName = '';

            let serviceType = 'TestLink';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new TestLink());
}