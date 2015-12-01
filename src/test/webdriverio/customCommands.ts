class CustomCommands {

    static timeTrackerWindow: string;

    static taskTrackerWindow: string;

    static services = <ServiceConfigs>require('./services.conf');

    waitForUrl(url: string, ignoreQuery?: boolean): PromisesAPlus.Thenable<any>
    waitForUrl(url: string, timeout: number, ignoreQuery?: boolean): PromisesAPlus.Thenable<any>
    waitForUrl(url: string, param1?: any, param2?: any) {

        var ignoreQuery: boolean;
        var timeout: number;
        if (param1 === !!param1) {
            ignoreQuery = param1;
            timeout = param2;
        }
        else {
            timeout = param1;
            ignoreQuery = param2;
        }

        var expectedUrl = url.toUpperCase();
        return browser.waitUntil(function () {
            return browser.url().then(function (res) {

                if (!res || !res.value) {
                    return false;
                }

                var newUrl = res.value.toUpperCase();
                if (ignoreQuery) {
                    newUrl = newUrl.replace(/\?.*/, '');
                }

                return newUrl == expectedUrl;
            });
        }, timeout || 10000);
    }

    waitForClick(selector: string, timeout?: number) {
        return browser
            .waitForVisible(selector, timeout)
            .click(selector);
    }

    waitForRerender(selector: string, timeout?: number) {
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
    }

    clickAndWaitForRerender(clickSelector: string, rerenderSelector: string, timeout?: number) {
        var rerenderHash;
        return browser
            .element(rerenderSelector).then(function (result) {
                rerenderHash = JSON.stringify(result.value);
            })
            .click(clickSelector)
            .waitUntil(function () {
                return browser.element(rerenderSelector).then(function (result) {
                    return JSON.stringify(result.value) != rerenderHash;
                });
            }, timeout);
    }

    login(serviceName: string, timeout?: number) {
        timeout = timeout || 10000;
        var service = CustomCommands.services[serviceName];
        var fullUrl;
        return browser
            .url(service.login.url)
            .url()
            .then(res => {
                fullUrl = res.value.toUpperCase();
            })
            .setValue(service.login.usernameField, service.login.username)
            .setValue(service.login.passwordField, service.login.password)
            .click(service.login.submitButton)
            .waitUntil(function () {
                return browser.url().then(function (res) {
                    return res && res.value && res.value.toUpperCase() != fullUrl
                });
            }, timeout)
            .url()
            .then(res => {
                if (res.value.toUpperCase() == fullUrl) {
                    // if we are on the same page, this means the login operation failed
                    throw new Error('Cannot login to ' + serviceName);
                }
            });
    }

    loginTimeTracker() {
        return browser
            .switchToTimeTrackerWindow()
            .login('TimeTracker')
            .waitForVisible('.page-actions');
    }

    switchToTaskTrackerWindow() {
        if (CustomCommands.taskTrackerWindow) {
            return browser.window(CustomCommands.taskTrackerWindow);
        }
        return browser
            .newWindow('about:blank')
            .windowHandle()
            .then(result => CustomCommands.taskTrackerWindow = result.value);
    }

    switchToTimeTrackerWindow() {
        if (CustomCommands.timeTrackerWindow) {
            return browser.window(CustomCommands.timeTrackerWindow);
        }
        return browser
            .newWindow('about:blank')
            .windowHandle()
            .then(result => CustomCommands.timeTrackerWindow = result.value);
    }

    stopRunningTask() {
        return browser
            .switchToTimeTrackerWindow()
            .isVisible('#btn-stop').then(function (isVisible) {
                if (isVisible) {
                    return browser
                        .click('#btn-stop')
                        .waitForVisible('#btn-stop', 10000, true);
                }
            });
    }

    logoutTimeTracker() {
        return browser
            .switchToTimeTrackerWindow()
            .deleteCookie()
            .pause(1000);
    }

    startAndTestTaskStarted(projectName: string, taskName: string, taskUrl: string) {
        return <PromisesAPlus.Thenable<any>>browser
            .waitForClick('.devart-timer-link-start')
            .waitForVisible('.devart-timer-link-stop')
            .pause(1000)
            .switchToTimeTrackerWindow()
            .waitForVisible('.timer-active')
            .getText('.timer-active .timer-td-project').should.eventually.be.equal(projectName)
            .getText('.timer-active div .text-overflow').should.eventually.be.equal(taskName)
            .getAttribute('.timer-active .issue-link', 'href').should.eventually.be.equal(taskUrl);
    }

    startStopAndTestTaskStopped() {
        return <PromisesAPlus.Thenable<any>>browser
            .waitForClick('.devart-timer-link-start')
            .waitForVisible('.devart-timer-link-stop')
            .waitForClick('.devart-timer-link-stop')
            .waitForVisible('.devart-timer-link-start')
            .pause(1000)
            .switchToTimeTrackerWindow()
            .waitForVisible('.page-actions')
            .isVisible('#btn-stop').should.eventually.be.false
            .isExisting('.timer-active').should.eventually.be.false;
    }
}

declare module PromisesAPlus {
    interface Thenable<T> extends CustomCommands { }
}

for (var commandName in CustomCommands.prototype) {
    browser.addCommand(commandName, CustomCommands.prototype[commandName]);
}