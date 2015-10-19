var services = require('./services.conf');

browser.addCommand("waitUrl", function (url, timeout) {
  var expectedUrl = url.toUpperCase();
  return browser.waitUntil(function () {
      return browser.url().then(function (res) {
        return res && res.value && res.value.toUpperCase() == expectedUrl;
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

browser.addCommand("testText", function (selector, expectedText) {
  return expect(browser.getText(selector)).eventually.equal(expectedText);
});

browser.addCommand("testAttribute", function (selector, attributeName, expectedValue) {
  return expect(browser.getAttribute(selector, attributeName)).eventually.equal(expectedValue);
});

browser.addCommand("testUrl", function (expectedUrl) {
  return expect(
      browser.url().then(function (result) {
        return result.value;
      })
    ).eventually.equal(expectedUrl);
});

browser.addCommand("stopRunningTask", function () {
  return browser
    .url('/')
    .isVisible('#btn-stop').then(function (isVisible) {
      if (isVisible) {
        return browser.click('#btn-stop');
      }
    });
});

browser.addCommand("startAndTestTaskStarted", function (projectName, taskName, taskUrl) {
  return browser
    .waitForExist('.devart-timer-link')
    .click('.devart-timer-link-start')
    .waitForExist('.devart-timer-link-stop')
    .url('/')
    .waitForExist('.timer-active')
    .testText('.timer-active .timer-td-project', projectName)
    .testText('.timer-active div .text-overflow', taskName)
    .testAttribute('.timer-active a.flex-item-no-shrink', 'href', taskUrl)
});

browser.addCommand("stopAndTestTaskStopped", function () {
  return browser
    .waitForExist('.devart-timer-link')
    .isExisting('.devart-timer-link-start').then(function () {
      return browser
        .click('.devart-timer-link-start')
        .waitForExist('.devart-timer-link-stop');
    })
    .click('.devart-timer-link-stop')
    .waitForExist('.devart-timer-link-start')
    .url('/')
    .waitForVisible('.page-actions')
    .isVisible('#btn-stop').then(function (visible) {
      expect(visible).to.be.false;
    })
    .isExisting('.timer-active').then(function (existing) {
      expect(existing).to.be.false;
    });
});
