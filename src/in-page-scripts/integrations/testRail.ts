class TestRail implements WebToolIntegration {

    showIssueId = true;

    matchUrl = '*://*/index.php?/runs/view/*';

    render(_issueElement: HTMLElement, linkElement: HTMLElement) {

        // test cases
        let buttons = $$('.button-group.form-buttons');
        if (buttons) {
            linkElement.classList.add('button', 'button-left', 'devart-timer-link-test-rail');
            buttons.appendChild(linkElement);
        }
    }

    getIssue(_issueElement: HTMLElement, source: Source) {

        const issueName = $$.try('.link-tooltip.content-header-title-tooltip').textContent;
        const projectName = $$.try('.top-section.top-section-with-return.text-ppp a').textContent;

        // https://example.testrail.io/
        const serviceUrl = source.protocol + source.host;
        const serviceType = 'TestRail';

        return {
            issueName, projectName, serviceUrl, serviceType
        } as WebToolIssue;
    }
}

IntegrationService.register(new TestRail());