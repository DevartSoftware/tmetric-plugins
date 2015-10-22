
describe('Extension integrates with', function () {

  before(function () {
    return browser
      .login("TimeTracker")
      .waitForVisible('.page-actions');
  });
  
  beforeEach(function () {
    return browser.stopRunningTask();
  });

  require('./gitlab.js');
  require('./jira.js');
  require('./redmine.js');

});
