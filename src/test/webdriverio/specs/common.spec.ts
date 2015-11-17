describe('Extension', function () {

    var services = require('../services.conf');
    var ttService = services['TimeTracker'];

    var testProjectName, testIssueName, testIssueUrl;

    function testTaskStarted() {
        return browser
            .url('/')
            .waitForVisible('.timer-active')
            .getText('.timer-active .timer-td-project').should.eventually.be.equal(testProjectName)
            .getText('.timer-active div .text-overflow').should.eventually.be.equal(testIssueName)
            .getAttribute('.timer-active a.flex-item-no-shrink', 'href').should.eventually.be.equal(testIssueUrl);
    }

    before(function () {
        return browser
            .url('https://gitlab.com/gitlab-org/gitlab-ce/issues')
            .waitForClick('.row_title')
            .waitForVisible('.devart-timer-link-start')
            .getText('.title a:nth-last-child(2)').then(function (text) {
                testProjectName = text;
                expect(testProjectName).to.be.a('string').and.not.to.be.empty;
            })
            .getText('.issue-title').then(function (text) {
                testIssueName = text;
                expect(testIssueName).to.be.a('string').and.not.to.be.empty;
            })
            .url().then(function (result) {
                testIssueUrl = result.value;
                expect(testIssueUrl).to.be.a('string').and.not.to.be.empty;
            });
    });

    beforeEach(function () {
        return browser
            .login('TimeTracker')
            .stopRunningTask()
            .deleteCookie();
    });

    function loginTimeTrackerThroughExtension() {
        return browser
            .waitUntil(function () {
                return browser.getTabIds().then(function (result) {
                    return result.length === 2;
                });
            })
            .getTabIds().then(function (result) {
                return browser.switchTab(result[1]);
            })
            .waitForVisible('body.login')
            .setValue(ttService.login.usernameField, ttService.login.username)
            .setValue(ttService.login.passwordField, ttService.login.password)
            .click(ttService.login.submitButton)
            .waitUntil(function () {
                return browser.getTabIds().then(function (result) {
                    return result.length === 1;
                })
            })
            .getTabIds().then(function (result) {
                return browser.switchTab(result[0]);
            });
    };

    it('prompts an unauthenticated user for login on starting a task using html button', function () {
        return browser
            .url(testIssueUrl)
            .waitForClick('.devart-timer-link-start')
            .pause(1000)
            .getTabIds().then(function (result) {
                expect(result.length).to.be.equal(2);
            })
            .then(loginTimeTrackerThroughExtension)
            .waitForVisible('.devart-timer-link-stop')
            .then(testTaskStarted);
    });

    it('do not prompts an authenticated user for login on starting a task using html button', function () {
        return browser
            .login('TimeTracker')
            .url(testIssueUrl)
            .waitForClick('.devart-timer-link-start')
            .pause(1000)
            .getTabIds().then(function (result) {
                expect(result.length).to.be.equal(1);
            })
            .waitForVisible('.devart-timer-link-stop')
            .then(testTaskStarted);
    });

    it('prompts an unauthenticated user for login on starting a task using extention shortcut', function () {
        return browser
            .url(testIssueUrl)
            .waitForVisible('.devart-timer-link-start')
            .keys(['Control', 'Shift', 'Space', 'NULL'])
            .pause(1000)
            .getTabIds().then(function (result) {
                expect(result.length).to.be.equal(2);
            })
            .then(loginTimeTrackerThroughExtension)
            .waitForVisible('.devart-timer-link-stop')
            .then(testTaskStarted);
    });

    it('do not prompts an authenticated user for login on starting a task using extention shortcut', function () {
        return browser
            .login('TimeTracker')
            .url(testIssueUrl)
            .waitForVisible('.devart-timer-link-start')
            .keys(['Control', 'Shift', 'Space', 'NULL'])
            .pause(1000)
            .getTabIds().then(function (result) {
                expect(result.length).to.be.equal(1);
            })
            .waitForVisible('.devart-timer-link-stop')
            .then(testTaskStarted);
    });

    it('can change html button when task is started or stoped by extension shortcut', function () {
        return browser
            .login('TimeTracker')
            .url(testIssueUrl)
            .waitForVisible('.devart-timer-link-start')
            .keys(['Control', 'Shift', 'Space', 'NULL'])
            .waitForVisible('.devart-timer-link-stop')
            .keys(['Control', 'Shift', 'Space', 'NULL'])
            .waitForVisible('.devart-timer-link-start');
    });

});
