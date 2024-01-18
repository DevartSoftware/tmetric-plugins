class TestLink implements WebToolIntegration {

    showIssueId = true;

    observeMutations = false;

    matchUrl = '*/lib/execute/*.php*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$('.groupBtn');
        if (host) {
            host.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source) {

        let projectId = '';
        let issueId = '';
        let issueName = '';

        var titleNodes = $$.findAllNodes('.exec_tc_title', Node.TEXT_NODE);

        titleNodes.some((childNode, i) => {
            // ver 1.9.3: '    Test Case tmet-1234 :: Version : 1 :: Case description  '
            // ver 1.9.14: '    Test Case ID tmet-1234:: Version: 1		'
            let match = /\s+([^\s]+)\-([\d]+)\s*::(.*)/.exec(childNode.nodeValue);
            if (match) {
                projectId = match[1]; // tmet
                issueId = `${projectId}-${match[2]}`; // tmet-1234
                match = /::(.*)/.exec(match[3]);
                if (match) {
                    issueName = match[1].trim(); // description in same node (ver 1.9.3)
                }
                if (!issueName && i + i < titleNodes.length) { // description in a separate text node (ver 1.9.14)
                    issueName = titleNodes[i + 1].nodeValue.trim();
                }
                return true;
            }
        });

        if (!issueName) {
            return;
        }

        // http(s)://testlink.company.local/lib/execute/...
        const serviceUrl = source.fullUrl.split('/lib/execute/')[0];
        const serviceType = 'TestLink';

        const issueUrl = `/linkto.php?tprojectPrefix=${projectId}&item=testcase&id=${issueId}`;

        return {
            issueId, issueName, serviceType, serviceUrl, issueUrl
        } as WebToolIssue;
    }
}

IntegrationService.register(new TestLink());