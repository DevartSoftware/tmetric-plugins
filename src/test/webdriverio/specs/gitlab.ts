describe("GitLab", function () {

    var testProjectName = 'gitlab-test-qazwsxedc';
    var testProjectUrl = '';

    var testIssueName = 'Issue for gitlab-test-qazwsxedc';
    var testIssueUrl = '';

    before(function () {

        function getTestIssueUrlFromAnchor() {
            return browser
                .getAttribute('a*=' + testIssueName, 'href')
                .then(function (result) {
                    testIssueUrl = result;
                });
        }

        function getTestIssueUrlFromUrl() {
            return browser
                .url()
                .then(function (result) {
                    testIssueUrl = result.value;
                });
        }

        function createTestProject() {
            return browser
                .url('https://gitlab.com/projects/new')
                .setValue('#project_path', testProjectName)
                .click('.btn.btn-create')
                .waitForVisible('.btn.btn-remove', 30000)
                .url().then(function (result) {
                    testProjectUrl = result.value;
                })
                .then(createTestIssue);
        }

        function createTestIssue() {
            return browser
                .url(testProjectUrl + '/issues/new')
                .setValue('#issue_title', testIssueName)
                .click('.btn.btn-create')
                .waitForVisible('.btn.btn-close.js-note-target-close')
                .then(getTestIssueUrlFromUrl);
        }

        function checkTestIssue() {
            return browser
                .url(testProjectUrl + '/issues')
                .isVisible('a*=' + testIssueName).then(function (result) {
                    return (result ? getTestIssueUrlFromAnchor : createTestIssue)();
                });
        }

        function checkTestProject() {
            return browser
                .url('https://gitlab.com/dashboard/projects')
                .isVisible('a*=' + testProjectName)
                .then(function (result) {
                    return (result ? function () {
                        return browser
                            .getAttribute('a*=' + testProjectName, 'href').then(function (result) {
                                testProjectUrl = result;
                            })
                            .then(checkTestIssue);
                    } : createTestProject)();
                });
        }

        function searchTestIssue() {
            return browser
                .url('https://gitlab.com/dashboard/issues?search=gitlab-test-qazwsxedc')
                .isVisible('a*=' + testIssueName).then(function (result) {
                    return (result ? getTestIssueUrlFromAnchor : checkTestProject)();
                });
        }

        return browser
            .login("GitLab")
            .then(searchTestIssue)
            .then(function () {
                expect(testIssueUrl).to.be.a('string').and.not.to.be.empty;
            });

    });

    it("can start timer on an issue", function () {
        return browser
            .url(testIssueUrl)
            .waitForVisible('.devart-timer-link')
            .getText('.title a:nth-last-child(2)').should.eventually.be.equal(testProjectName)
            .getText('.issue-title').should.eventually.be.equal(testIssueName)
            .url().should.eventually.has.property('value', testIssueUrl)
            .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
    });

    it("can stop timer on an issue", function () {
        return browser
            .url(testIssueUrl)
            .startStopAndTestTaskStopped();
    });

});
