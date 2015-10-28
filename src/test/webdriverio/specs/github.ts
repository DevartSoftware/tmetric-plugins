describe("GitHub", function () {

    var bugTrackerUrl = 'http://github.com';

    var testProjectName = 'github-test-qazwsxedc';
    var testProjectUrl = '';

    var testIssueName = 'Issue for ' + testProjectName;
    var testIssueUrl = '';

    before(function () {

        function getTestProjectUrlFromAnchor() {
            return browser
                .getAttribute('a*=' + testProjectName, 'href')
                .then(function (result) {
                    testProjectUrl = result;
                });
        }

        function getTestProjectUrlFromUrl() {
            console.log('getTestProjectUrlFromUrl');
            return browser
                .url()
                .then(function (result) {
                    console.log('getTestProjectUrlFromUrl', result);
                    testProjectUrl = result.value;
                });
        }

        function getTestIssueUrlFromAnchor() {
            console.log('getTestIssueUrlFromAnchor');
            return browser
                .getAttribute('a*=' + testIssueName, 'href')
                .then(function (result) {
                    console.log('getTestIssueUrlFromAnchor', result);
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
                .url(bugTrackerUrl + '/new')
                .setValue('#repository_name', testProjectName)
                .click('.btn.btn-primary')
                .waitForExist('.sunken-menu.repo-nav.js-repo-nav')
                .then(getTestProjectUrlFromUrl)
                .then(createTestIssue);
        }

        function createTestIssue() {
            return browser
                .url(testProjectUrl + '/issues/new')
                .setValue('#issue_title', testIssueName)
                .click('.btn.btn-primary')
                .waitForExist('.btn.js-comment-and-button')
                .then(getTestIssueUrlFromUrl);
        }

        function checkTestIssue() {
            return browser
                .url(bugTrackerUrl + '/issues')
                .isExisting('a*=' + testIssueName)
                .then(function (result) {
                    return (result ? getTestIssueUrlFromAnchor : createTestIssue)();
                });
        }

        function checkTestProject() {
            return browser
                .url(bugTrackerUrl)
                .setValue('#your-repos-filter', testProjectName)
                .isExisting('a*=' + testProjectName)
                .then(function (result) {
                    return (result ? function () {
                        return browser
                            .then(getTestProjectUrlFromAnchor)
                            .then(checkTestIssue);
                    } : createTestProject)();
                });
        }

        function searchTestIssue() {
            return browser
                .url(bugTrackerUrl + '/issues')
                .isExisting('a*=' + testIssueName).then(function (result) {
                    return (result ? getTestIssueUrlFromAnchor : checkTestProject)();
                });
        }

        return browser
            .login("GitHub")
            .then(searchTestIssue)
            .then(function () {
                expect(testIssueUrl).to.be.a('string').and.not.to.be.empty;
            });

    });

    it("can start timer on an issue", function () {
        return browser
            .url(testIssueUrl)
            .waitForExist('.devart-timer-link')
            .getText('.entry-title > strong > a').should.eventually.be.equal(testProjectName)
            .getText('.js-issue-title').should.eventually.be.equal(testIssueName)
            .url().should.eventually.has.property('value', testIssueUrl)
            .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
    });

    it("can stop timer on an issue", function () {
        return browser
            .url(testIssueUrl)
            .startStopAndTestTaskStopped();
    });

});
