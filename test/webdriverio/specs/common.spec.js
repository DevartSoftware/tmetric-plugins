
describe('Extension', function () {

  var services = require('../services.conf');

  it('prompts an unauthenticated user for login on starting a task', function () {
    
    var projectName, taskName, taskUrl;

    var service = services['TimeTracker'];

    return browser
      .login('TimeTracker')
      .waitForVisible('.page-actions')
      .stopRunningTask()
      .deleteCookie()
      .url('http://demo.redmine.org/issues')
      .click('.id a')
      .waitForExist('.devart-timer-link-start')
      .getText('#header h1').then(function (text) {
        projectName = text;
      })
      .getText('.subject h3').then(function (text) {
        taskName = text;
      })
      .url().then(function (result) {
        taskUrl = result.value;
      })
      .click('.devart-timer-link-start')
      .waitUntil(function () {
        return browser.getTabIds().then(function (result) {
          return result.length === 2;
        })
      })
      .getTabIds().then(function (result) {
        return browser.switchTab(result[1]);
      })
      .waitForExist('body.login')
      .setValue(service.login.usernameField, service.login.username)
      .setValue(service.login.passwordField, service.login.password)
      .click(service.login.submitButton)
      // .login('TimeTracker', true)
      .waitUntil(function () {
        return browser.getTabIds().then(function (result) {
          return result.length === 1;
        })
      })
      .getTabIds().then(function (result) {
        return browser.switchTab(result[0]);
      })
      .url('/')
      .then(function () {
        return browser
          .waitForExist('.timer-active')
          .getText('.timer-active .timer-td-project').should.eventually.be.equal(projectName)
          .getText('.timer-active div .text-overflow').should.eventually.be.equal(taskName)
          .getAttribute('.timer-active a.flex-item-no-shrink', 'href').should.eventually.be.equal(taskUrl);
      });

  });

});
