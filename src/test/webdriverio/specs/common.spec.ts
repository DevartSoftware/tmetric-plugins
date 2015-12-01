describe('Extension', function () {

    var services = <ServiceConfigs>require('../services.conf');
    var ttService = services['TimeTracker'];
    var testProjectName: string
    var testIssueName: string
    var testIssueUrl: string;

    before(() => browser
        .loginTimeTracker()
        .switchToTaskTrackerWindow()
        .url('https://gitlab.com/gitlab-org/gitlab-ce/issues')
        .waitForClick('.row_title')
        .waitForVisible('.devart-timer-link-start')
        .getText('.title a:nth-last-child(2)').then(function (text) {
            testProjectName = text;
            expect(testProjectName).to.be.a('string').and.not.to.be.empty;
        })
        .getText('.issue-title').then(text => {
            testIssueName = text;
            expect(testIssueName).to.be.a('string').and.not.to.be.empty;
        })
        .url().then(result => {
            testIssueUrl = result.value;
            expect(testIssueUrl).to.be.a('string').and.not.to.be.empty;
        }));

    beforeEach(() => browser
        .stopRunningTask());

    after(() => browser
        .switchToTimeTrackerWindow());

    function loginTimeTrackerThroughExtension() {
        var loginWindow: string;
        return browser
            .windowHandles()
            .then(result => {
                loginWindow = result.value[result.value.length - 1];
                return browser.window(loginWindow);
            })
            .url()
            .then(result => {
                expect(result.value.toLowerCase()).to.contain('/login');
                expect(result.value.toLowerCase()).to.contain('/noapp');
            })
            .waitForVisible('body.login')
            .setValue(ttService.login.usernameField, ttService.login.username)
            .setValue(ttService.login.passwordField, ttService.login.password)
            .click(ttService.login.submitButton)
            .waitUntil(() => browser.windowHandles().then(result => result.value.indexOf(loginWindow) < 0));
    };

    function testTaskStarted() {
        return browser
            .switchToTimeTrackerWindow()
            .waitForVisible('.timer-active')
            .getText('.timer-active .timer-td-project').should.eventually.be.equal(testProjectName)
            .getText('.timer-active div .text-overflow').should.eventually.be.equal(testIssueName)
            .getAttribute('.timer-active a.flex-item-no-shrink', 'href').should.eventually.be.equal(testIssueUrl);
    }

    it('prompts an unauthenticated user for login on starting a task using html button', () => browser
        .logoutTimeTracker()
        .switchToTaskTrackerWindow()
    // start task
        .waitForClick('.devart-timer-link-start')
        .pause(1000)
    // login
        .then(loginTimeTrackerThroughExtension)
        .switchToTaskTrackerWindow()
        .waitForVisible('.devart-timer-link-stop')
    // test task
        .then(testTaskStarted));

    it('do not prompts an authenticated user for login on starting a task using html button', () => browser
        .switchToTaskTrackerWindow()
    // start task
        .waitForClick('.devart-timer-link-start')
        .pause(1000)
        .waitForVisible('.devart-timer-link-stop')
    // test task
        .then(testTaskStarted));

    it('prompts an unauthenticated user for login on starting a task using extention shortcut', () => browser
        .logoutTimeTracker()
        .switchToTaskTrackerWindow()
    // start task
        .waitForVisible('.devart-timer-link-start')
        .keys(['Control', 'Shift', 'Space', 'NULL'])
        .pause(1000)
    // login
        .then(loginTimeTrackerThroughExtension)
        .switchToTaskTrackerWindow()
        .waitForVisible('.devart-timer-link-stop')
    // test task
        .then(testTaskStarted));

    it('do not prompts an authenticated user for login on starting a task using extention shortcut', () => browser
        .switchToTaskTrackerWindow()
    // start task
        .waitForVisible('.devart-timer-link-start')
        .keys(['Control', 'Shift', 'Space', 'NULL'])
        .pause(1000)
        .waitForVisible('.devart-timer-link-stop')
    // test task
        .then(testTaskStarted));

    it('can change html button when task is started or stoped by extension shortcut', () => browser
        .switchToTaskTrackerWindow()
        .waitForVisible('.devart-timer-link-start')
        .keys(['Control', 'Shift', 'Space', 'NULL'])
        .waitForVisible('.devart-timer-link-stop')
        .keys(['Control', 'Shift', 'Space', 'NULL'])
        .waitForVisible('.devart-timer-link-start'));
});