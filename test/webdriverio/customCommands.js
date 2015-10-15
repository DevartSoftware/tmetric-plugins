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

browser.addCommand("logout", function (serviceName) {
  var service = services[serviceName];
  return browser
    .url(service.logout.url);
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
    // .waitForExist('.timer-active')
    // .getText('.timer-active .timer-td-project').then(function (text) {
    //   expect(text).toBe(projectName);
    // })
    // .getText('.timer-active div .text-overflow').then(function (text) {
    //   expect(text).toBe(taskName);
    // })
    // .getAttribute('.timer-active a.flex-item-no-shrink', 'href').then(function (text) {
    //   expect(text).toBe(taskUrl);
    // })
    .waitForExist('.portlet-body .timer-table')
    .isVisible('#btn-stop').then(function (visible) {
      expect(visible).to.be.true;
    })
    .getText('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-project")]/span').then(function (text) {
      expect(text).to.be.equal(projectName);
    })
    .getText('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-task")]/div/div/span').then(function (text) {
      expect(text).to.be.equal(taskName);
    })
    .getAttribute('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-task")]/div/a', 'href').then(function (value) {
      expect(value).to.be.equal(taskUrl);
    });
});

browser.addCommand("stopAndTestTaskStopped", function () {
  return browser
    .waitForExist('.devart-timer-link')
    .click('.devart-timer-link-start')
    .waitForExist('.devart-timer-link-stop')
    .click('.devart-timer-link-stop')
    .waitForExist('.devart-timer-link-start')
    .url('/')
    // .waitForVisible('.page-actions')
    // .isVisible('#btn-stop')
    // .then(function(isVisible){
    //   expect(isVisible).toBeFalsy();
    // })
    .waitForExist('.portlet-body > div')
    .isVisible('#btn-stop').then(function (visible) {
      expect(visible).to.be.false;
    })
    .isExisting('//tr[td/div/span[contains(.,"Active")]]').then(function (existing) {
      expect(existing).to.be.false;
    });
});
