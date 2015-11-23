var services = require('./services.conf');

browser.addCommand("waitUrl", function (url, timeout) {
    var expectedUrl = url.toUpperCase();
    return browser.waitUntil(function () {
        return browser.url().then(function (res) {
            return res && res.value && res.value.toUpperCase() == expectedUrl;
        });
    }, timeout);
});

browser.addCommand("waitForClick", function (selector, timeout) {
    return browser
        .waitForVisible(selector, timeout)
        .click(selector);
});

browser.addCommand("waitForRerender", function (selector, timeout) {
    var elementHash;
    return browser
        .element(selector).then(function (result) {
            elementHash = JSON.stringify(result.value);
        })
        .waitUntil(function () {
            return browser.element(selector).then(function (result) {
                return JSON.stringify(result.value) != elementHash;
            });
        }, timeout);
});

browser.addCommand("login", function (serviceName) {
    var service = services[serviceName];
    var fullUrl;
    return this
        .url(service.login.url)
        .url(function (err, res) {
            fullUrl = res.value.toUpperCase();
        })
        .setValue(service.login.usernameField, service.login.username)
        .setValue(service.login.passwordField, service.login.password)
        .click(service.login.submitButton)
        .waitUntil(function () {
            return browser.url().then(function (res) {
                return res && res.value && res.value.toUpperCase() != fullUrl
            });
        }, 10000)
        .url(function (err, res) {
            if (res.value.toUpperCase() == fullUrl) {
                // if we are on the same page, this means the login operation failed
                return new Error('Cannot login to ' + serviceName);
            }
        });
});

// timetracker commands

var timeTrackerWindow;

browser.addCommand("loginTimeTracker", function () {
    return browser
        .login('TimeTracker')
        .waitForVisible('.page-actions')
        .windowHandles().then(function (result) {
            expect(result.value.length).to.be.equal(1);
            timeTrackerWindow = result.value[0];
        });
});

browser.addCommand("switchToTimeTrackerWindow", function () {
    return browser
        .then(function () {
            return browser.window(timeTrackerWindow);
        });
});

browser.addCommand("stopRunningTask", function () {
    return browser
        .switchToTimeTrackerWindow()
        .isVisible('#btn-stop').then(function (isVisible) {
            if (isVisible) {
                return browser
                    .click('#btn-stop')
                    .waitForVisible('#btn-stop', 10000, true);
            }
        });
});

browser.addCommand("logoutTimeTracker", function () {
    return browser
        .switchToTimeTrackerWindow()
        .deleteCookie()
        .pause(1000);
});

// tasktracker commands

var taskTrackerWindow;

browser.addCommand("openTaskTrackerWindow", function () {
    return browser
        .newWindow('about:blank')
        .windowHandles().then(function (result) {
            expect(result.value.length).to.be.equal(2);
            taskTrackerWindow = result.value[1];
        });
});

browser.addCommand("switchToTaskTrackerWindow", function () {
    return browser
        .then(function () {
            return browser.window(taskTrackerWindow);
        });
});

browser.addCommand("closeTaskTrackerWindow", function (tasktracker) {
    return browser
        .switchToTaskTrackerWindow()
        .close();
});

// testing commands

browser.addCommand("startAndTestTaskStarted", function (projectName, taskName, taskUrl) {
    return browser
        .waitForClick('.devart-timer-link-start')
        .waitForVisible('.devart-timer-link-stop')
        .pause(1000)
        .switchToTimeTrackerWindow()
        .waitForVisible('.timer-active')
        .getText('.timer-active .timer-td-project').should.eventually.be.equal(projectName)
        .getText('.timer-active div .text-overflow').should.eventually.be.equal(taskName)
        .getAttribute('.timer-active .issue-link', 'href').should.eventually.be.equal(taskUrl)
});

browser.addCommand("startStopAndTestTaskStopped", function () {
    return browser
        .waitForClick('.devart-timer-link-start')
        .waitForVisible('.devart-timer-link-stop')
        .waitForClick('.devart-timer-link-stop')
        .waitForVisible('.devart-timer-link-start')
        .pause(1000)
        .switchToTimeTrackerWindow()
        .waitForVisible('.page-actions')
        .isVisible('#btn-stop').should.eventually.be.false
        .isExisting('.timer-active').should.eventually.be.false;
});

