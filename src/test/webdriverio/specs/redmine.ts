describe("Redmine", function () {
    var bugTrackerUrl = 'http://demo.redmine.org';

    var testProjectName = 'redmine-test-qazwsxedc';
    var testProjectUrl = bugTrackerUrl + '/projects/redmine-test-qazwsxedc';

    var testIssueName = 'Issue for redmine-test-qazwsxedc';
    var testIssueSearchUrl = bugTrackerUrl + '/issues?subject=Issue for redmine-test-qazwsxedc';
    var testIssueUrl = '';

    before(function () {
        function getTestIssueUrlFromAnchor() {
            return browser
                .getAttribute('a*=' + testIssueName, 'href').then(function (result) {
                    testIssueUrl = result;
                });
        }

        function createTestProject() {
            return browser
                .url(bugTrackerUrl + '/projects/new')
                .setValue('#project_name', testProjectName)
                .click('input[name=commit]')
                .waitForUrl(bugTrackerUrl + '/projects/redmine-test-qazwsxedc/settings')
                .url(testProjectUrl)
                .then(createTestIssue);
        }

        function createTestIssue() {
            return browser
                .url(bugTrackerUrl + '/projects/redmine-test-qazwsxedc/issues/new')
                .setValue('#issue_subject', testIssueName)
                .click('input[name=commit]')
                .waitForVisible('.contextual .icon.icon-del')
                .url(bugTrackerUrl + '/projects/redmine-test-qazwsxedc/issues')
                .then(getTestIssueUrlFromAnchor);
        }

        function checkTestIssue() {
            return browser
                .url(bugTrackerUrl + '/projects/redmine-test-qazwsxedc/issues')
                .isVisible('a*=' + testIssueName).then(function (result) {
                    return (result ? getTestIssueUrlFromAnchor : createTestIssue)();
                });
        }

        function checkTestProject() {
            return browser
                .url(bugTrackerUrl + '/projects')
                .isVisible('a*=' + testProjectName).then(function (result) {
                    return (result ? checkTestIssue : createTestProject)();
                });
        }

        function searchTestIssue() {
            return browser
                .url(testIssueSearchUrl)
                .isVisible('a*=' + testIssueName).then(function (result) {
                    return (result ? getTestIssueUrlFromAnchor : checkTestProject)();
                });
        }

        var service = <ServiceConfig>require('./../services.conf').Redmine;

        return browser
            .switchToTaskTrackerWindow()
            .url(service.login.url)
            .setValue(service.login.usernameField, service.login.username)
            .setValue(service.login.passwordField, service.login.password)
            .clickAndWaitForRerender(service.login.submitButton, 'html')
            .isVisible('#flash_error').then(function (visible) {
                if (visible) {
                    return browser
                        .url(bugTrackerUrl + '/account/register')
                        .setValue('#user_login', service.login.username)
                        .setValue('#user_password', service.login.password)
                        .setValue('#user_password_confirmation', service.login.password)
                        .setValue('#user_firstname', service.login.username + '_firstname')
                        .setValue('#user_lastname', service.login.username + '_lastname')
                        .setValue('#user_mail', service.login.username + '@example.com')
                        .clickAndWaitForRerender('input[type="submit"]', 'html');
                }
            })
            .then(searchTestIssue)
            .then(function () {
                expect(testIssueUrl).to.be.a('string').and.not.to.be.empty;
            });
    });

    it("can start timer on an issue", function () {
        return browser
            .url(testIssueUrl)
            .waitForVisible('.devart-timer-link')
            .getText('#header h1').should.eventually.be.equal(testProjectName)
            .getText('.subject h3').should.eventually.be.equal(testIssueName)
            .url().should.eventually.has.property('value', testIssueUrl)
            .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
    });

    it("can stop timer on an issue", function () {
        return browser
            .url(testIssueUrl)
            .startStopAndTestTaskStopped();
    });
});