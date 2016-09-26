module Integrations {

    class TestLink implements WebToolIntegration {

        matchUrl = '*/lib/execute/*.php*';

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            let host = $$('.groupBtn');
            if (host) {
                host.appendChild(linkElement);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let titleNode = $$('.exec_tc_title');
            if (!titleNode) {
                return;
            }

            let projectId = '';
            let issueId = '';
            let issueName = '';

            for (let i = 0; i < titleNode.childNodes.length; i++) {

                let childNode = titleNode.childNodes[i];

                if (childNode.nodeType == Node.TEXT_NODE) {

                    // '    Test Case ID tmet-1234:: Version: 1		'
                    // '    Test Case tmet-1234 :: Version : 1 :: Case description  '
                    let match = /\s+([^\s]+)\-([\d]+)\s*::(.*)/.exec(childNode.nodeValue);
                    if (match) {
                        projectId = match[1]; // tmet
                        issueId = `${projectId}-${match[2]}`; // tmet-1234
                        match = /::(.*)/.exec(match[3]);
                        if (match) {
                            issueName = match[1].trim(); // description in same node (ver 1.9.3)
                        }
                        if (!issueName) { // description in a separate text node (ver 1.9.14)
                            for (i++; i < titleNode.childNodes.length; i++) {
                                childNode = titleNode.childNodes[i];
                                if (childNode.nodeType == Node.TEXT_NODE) {
                                    issueName = childNode.nodeValue.trim();
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }

            if (!issueName) {
                return;
            }

            // http(s)://testlink.company.local/lib/execute/...
            let serviceUrl = source.fullUrl.split('/lib/execute/')[0];

            let issueUrl = `/linkto.php?tprojectPrefix=${projectId}&item=testcase&id=${issueId}`;

            let projectName = '';

            let serviceType = 'TestLink';

            return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
        }
    }

    IntegrationService.register(new TestLink());
}