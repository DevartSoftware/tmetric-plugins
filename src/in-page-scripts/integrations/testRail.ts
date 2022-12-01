class TestRail implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = '*://*/index.php?/runs/view/*';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        // test cases
        let buttons = $$('.button-group.form-buttons');
        if (buttons) {
            linkElement.classList.add('button', 'button-left', 'devart-timer-link-test-rail');
            buttons.appendChild(linkElement);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.link-tooltip.content-header-title-tooltip').textContent;

        let projectName = $$.try('.top-section.top-section-with-return.text-ppp a').textContent;

        // https://example.testrail.io/
        let serviceUrl = source.protocol + source.host;

        return { issueName, projectName, serviceUrl, serviceType: 'TestRail' };
    }
}

IntegrationService.register(new TestRail());