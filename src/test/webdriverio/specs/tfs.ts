describe("TFS", function () {

    var service = require('./../services.conf').TFS;

    var taskTrackerUrl = 'https://' + service.login.username.split('@')[0] + '.visualstudio.com/';

    var testProjectName = 'tfs-test-qazwsxedc';
    var testProjectUrl = taskTrackerUrl + 'DefaultCollection/' + testProjectName + '/';

    var testIssueName = 'Issue for tfs-test-qazwsxedc';
    var testIssueSearchUrl = taskTrackerUrl + '/issues?subject=Issue for redmine-test-qazwsxedc';
    var testIssueRedirectedUrl = '';
    var testIssueUrl = '';

    before(function () {

        // logining and creating of test items in tfs are very time consuming operations
        // increase test runner default timeout for this hook
        this.timeout(300000);

        return browser
            .switchToTaskTrackerWindow()
            .login('TFS', 30000)
            .url('https://app.vssps.visualstudio.com/Profile/View') // redirected to check login
            .waitForUrl('https://app.vssps.visualstudio.com/Profile/View') // wait to come back
        // search or create project
            .url(testProjectUrl + '_dashboards')
            .waitForUrl(testProjectUrl + '_dashboards')
        // check error page is showed
        // when test project was not created yet
            .isExisting('li.error-code=404').then(function (result) {
                return result == true ?
                    // create test project
                    browser
                        .url(taskTrackerUrl + '_createproject')
                        .waitForVisible('#create-project-name')
                        .setValue('#create-project-name', testProjectName)
                        .click('#create-project-button')
                        .waitForUrl(testProjectUrl + '_dashboards', 180000, true)
                        .waitForExist('#go-to-backlog-button')
                        .click('#go-to-backlog-button') :
                    browser;
            })
        // search or create issue
            .url(testProjectUrl + '_workitems')

            .waitForVisible('.text-filter-input')
            .setValue('.text-filter-input', testIssueName)
            .pause(500)

            .isVisible('.grid-cell*=' + testIssueName).then(function (result) {
                return result == true ?
                    browser :
                    browser
                        .url(testProjectUrl + '/_workitems#witd=Issue&_a=new')
                        .waitForVisible('input[aria-label="Title"]')
                        .setValue('input[aria-label="Title"]', testIssueName)
                        .waitForVisible('li[command="save-work-item"][disabled]', 5000, true)
                        .waitForClick('li[command="save-work-item"]')
                        .waitForVisible('li[command="save-work-item"][disabled]')
                        .url(testProjectUrl + '_workitems')
                        .waitForVisible('.grid-cell*=' + testIssueName);

            })
        // get test issue url
            .click('.grid-cell*=' + testIssueName)
            .waitForVisible('.info-text-wrapper a')
            .clickAndWaitForRerender('.info-text-wrapper a', 'html')
            .waitForVisible('.devart-timer-link')
            .getAttribute('.info-text-wrapper a', 'href').then(function (result) {
                testIssueUrl = result.replace(/\?.*$/, ''); // remove search as integration do
                expect(testIssueUrl).to.be.a('string').and.not.to.be.empty;
            })
            .url().then(function (result) {
                testIssueRedirectedUrl = result.value;
                expect(testIssueRedirectedUrl).to.be.a('string').and.not.to.be.empty;
            });

    });

    it("can start timer on an issue", function () {
        return browser
            .url(testIssueUrl)
            .waitForVisible('.devart-timer-link')
            .getText('.header-item.project-selector-nav-menu > li > span').should.eventually.be.equal(testProjectName)
            .getText('.workitem-info-bar .info-text').should.eventually.be.equal(testIssueName)
            .url().should.eventually.has.property('value', testIssueRedirectedUrl)
            .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
    });

    it("can stop timer on an issue", function () {
        return browser
            .url(testIssueUrl)
            .waitForVisible('.devart-timer-link')
            .startStopAndTestTaskStopped();
    });

    it("can start timer on an issue at work items list details pane", function () {
        return browser
            .url(testProjectUrl + '_workitems')
            // wait active item details loaded
            .waitForVisible('.devart-timer-link')
            // find test item
            .waitForVisible('.text-filter-input')
            .setValue('.text-filter-input', testIssueName)
            .pause(500)
            // wait active item details renew
            .waitForVisible('.devart-timer-link')
            // test
            .getText('.header-item.project-selector-nav-menu > li > span').should.eventually.be.equal(testProjectName)
            .getText('.workitem-info-bar .info-text').should.eventually.be.equal(testIssueName)
            .url().should.eventually.has.property('value', testProjectUrl + '_workitems')
            .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
    });

    it("can stop timer on an issue at work items list details pane", function () {
        return browser
            .url(testProjectUrl + '_workitems')
            // wait active item details loaded
            .waitForVisible('.devart-timer-link')
            // find test item
            .waitForVisible('.text-filter-input')
            .setValue('.text-filter-input', testIssueName)
            .pause(500)
            // wait active item details renew
            .waitForVisible('.devart-timer-link')
            // test
            .startStopAndTestTaskStopped();
    });

});