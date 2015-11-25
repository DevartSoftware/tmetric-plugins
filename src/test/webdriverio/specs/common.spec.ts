describe('Extension', function () {

    var services = <ServiceConfigs>require('../services.conf');
    var ttService = services['TimeTracker'];

    var testProjectName, testIssueName, testIssueUrl;

    var loginWindow;

    before(function () {
        return browser
            .loginTimeTracker()
            .openTaskTrackerWindow()
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
            .stopRunningTask();
    });

    after(function () {
        return browser
            .closeTaskTrackerWindow()
            .switchToTimeTrackerWindow();
    });

    function loginTimeTrackerThroughExtension() {
        return browser
            .then(function () {
                return browser.window(loginWindow);
            })
            .waitForVisible('body.login')
            .setValue(ttService.login.usernameField, ttService.login.username)
            .setValue(ttService.login.passwordField, ttService.login.password)
            .click(ttService.login.submitButton)
            .waitUntil(function () {
                return browser.windowHandles().then(function (result) {
                    return result.value.length === 2;
                })
            })
    };

    function testTaskStarted() {
        return browser
            .switchToTimeTrackerWindow()
            .waitForVisible('.timer-active')
            .getText('.timer-active .timer-td-project').should.eventually.be.equal(testProjectName)
            .getText('.timer-active div .text-overflow').should.eventually.be.equal(testIssueName)
            .getAttribute('.timer-active a.flex-item-no-shrink', 'href').should.eventually.be.equal(testIssueUrl);
    }

    it('prompts an unauthenticated user for login on starting a task using html button', function () {
        return browser
            .logoutTimeTracker()
            .switchToTaskTrackerWindow()
        // start task
            .waitForClick('.devart-timer-link-start')
            .pause(1000)
            .windowHandles().then(function (result) {
                expect(result.value.length).to.be.equal(3);
                loginWindow = result.value[2];
            })
        // login
            .then(loginTimeTrackerThroughExtension)
            .switchToTaskTrackerWindow()
            .waitForVisible('.devart-timer-link-stop')
        // test task
            .then(testTaskStarted);
    });

    it('do not prompts an authenticated user for login on starting a task using html button', function () {
        return browser
            .switchToTaskTrackerWindow()
        // start task
            .waitForClick('.devart-timer-link-start')
            .pause(1000)
            .windowHandles().then(function (result) {
                expect(result.value.length).to.be.equal(2);
                loginWindow = null;
            })
            .waitForVisible('.devart-timer-link-stop')
        // test task
            .then(testTaskStarted);
    });

    it('prompts an unauthenticated user for login on starting a task using extention shortcut', function () {
        return browser
            .logoutTimeTracker()
            .switchToTaskTrackerWindow()
        // start task
            .waitForVisible('.devart-timer-link-start')
            .keys(['Control', 'Shift', 'Space', 'NULL'])
            .pause(1000)
            .windowHandles().then(function (result) {
                expect(result.value.length).to.be.equal(3);
                loginWindow = result.value[2];
            })
        // login
            .then(loginTimeTrackerThroughExtension)
            .switchToTaskTrackerWindow()
            .waitForVisible('.devart-timer-link-stop')
        // test task
            .then(testTaskStarted);
    });

    it('do not prompts an authenticated user for login on starting a task using extention shortcut', function () {
        return browser
            .switchToTaskTrackerWindow()
        // start task
            .waitForVisible('.devart-timer-link-start')
            .keys(['Control', 'Shift', 'Space', 'NULL'])
            .pause(1000)
            .windowHandles().then(function (result) {
                expect(result.value.length).to.be.equal(2);
                loginWindow = null;
            })
            .waitForVisible('.devart-timer-link-stop')
        // test task
            .then(testTaskStarted);
    });

    it('can change html button when task is started or stoped by extension shortcut', function () {
        return browser
            .switchToTaskTrackerWindow()
            .waitForVisible('.devart-timer-link-start')
            .keys(['Control', 'Shift', 'Space', 'NULL'])
            .waitForVisible('.devart-timer-link-stop')
            .keys(['Control', 'Shift', 'Space', 'NULL'])
            .waitForVisible('.devart-timer-link-start');
    });
});