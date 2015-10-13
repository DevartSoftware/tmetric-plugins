var services = require('./services.conf');

browser.addCommand("waitUrl", function (url, timeout) {
  var expectedUrl = url.toUpperCase();
  return browser.waitUntil(function () {
      return browser.url().then(function (res) {
        return res && res.value && res.value.toUpperCase() != expectedUrl;
      });
    }, timeout);
});

browser.addCommand("login", function (serviceName) {
  var service = services[serviceName];
  var fullUrl;
  return this.url(service.login.url)
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
    }, 5000)
    .url(function (err, res) {
      if (res.value.toUpperCase() == fullUrl) {
        // if we are on the same page, this means the login operation failed
        return new Error('Cannot login to ' + serviceName);
      }
    });
});

browser.addCommand("testIsVisible", function (selector) {
  return browser
    .isVisible(selector)
    .then(function (result) {
      expect(result).toBeTruthy();
    });
});

browser.addCommand("testIsNotVisible", function (selector) {
  return browser
    .isVisible(selector)
    .then(function (result) {
      expect(result).toBeFalsy();
    });
});

browser.addCommand("testIsExisting", function (selector) {
  return browser
    .isExisting(selector)
    .then(function (result) {
      expect(result).toBeTruthy();
    });
});

browser.addCommand("testIsNotExisting", function (selector) {
  return browser
    .isExisting(selector)
    .then(function (result) {
      expect(result).toBeFalsy();
    });
});

browser.addCommand("testText", function (selector, resultExpected) {
  return browser
    .getText(selector)
    .then(function (result) {
      expect(result).toBe(resultExpected);
    });
});

browser.addCommand("testAttribute", function (selector, attributeName, resultExpected) {
  return browser
    .getAttribute(selector, attributeName)
    .then(function (result) {
      expect(result).toBe(resultExpected);
    });
});

browser.addCommand("testActiveTask", function (projectName, taskName, taskUrl) {
  return browser
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
    .testIsVisible('#btn-stop')
    .testText('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-project")]/span', projectName)
    .testText('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-task")]/div/div/span', taskName)
    .testAttribute('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-task")]/div/a', 'href', taskUrl)
    ;
});

browser.addCommand("testActiveTaskAbsent", function () {
  return browser
    // .waitForVisible('.page-actions')
    // .isVisible('#btn-stop')
    // .then(function(isVisible){
    //   expect(isVisible).toBeFalsy();
    // })
    .waitForExist('.portlet-body > div')
    .testIsNotVisible('#btn-stop')
    .testIsNotExisting('//tr[td/div/span[contains(.,"Active")]]')
    ;
});

browser.addCommand("stopAndTestTaskAbsent", function () {
  return browser
    .waitForExist('.devart-timer-link')
    .isExisting('.devart-timer-link-start')
    .then(function (result) {
      if (result) {
        return browser
          .click('.devart-timer-link-start')
          .waitForExist('.devart-timer-link-stop');
      }
    })
    .click('.devart-timer-link-stop')
    .url('/')
    .testActiveTaskAbsent()
    ;
});
