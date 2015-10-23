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

browser.addCommand("stopRunningTask", function () {
  return browser
    .url('/')
    .waitForVisible('.page-actions')
    .isVisible('#btn-stop').then(function (isVisible) {
      if (isVisible) {
        return browser
          .click('#btn-stop')
          .waitForVisible('#btn-stop', 1000, true);
      }
    });
});

browser.addCommand("startAndTestTaskStarted", function (projectName, taskName, taskUrl) {
  return browser
    .waitForClick('.devart-timer-link-start')
    .waitForVisible('.devart-timer-link-stop')
    .url('/')
    .waitForVisible('.timer-active')
    .getText('.timer-active .timer-td-project').should.eventually.be.equal(projectName)
    .getText('.timer-active div .text-overflow').should.eventually.be.equal(taskName)
    .getAttribute('.timer-active .issue-link', 'href').should.eventually.be.equal(taskUrl)
});

browser.addCommand("startStopAndTestTaskStopped", function () {
  return browser
    .waitForClick('.devart-timer-link-start')
    .waitForClick('.devart-timer-link-stop')
    .waitForVisible('.devart-timer-link-start')
    .url('/')
    .waitForVisible('.page-actions')
    .isVisible('#btn-stop').should.eventually.be.false
    .isExisting('.timer-active').should.eventually.be.false;
});
