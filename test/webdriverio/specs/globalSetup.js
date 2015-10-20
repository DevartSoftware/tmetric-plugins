
before(function () {
  return browser
    .login("TimeTracker")
    .waitForVisible('.page-actions');
});

beforeEach(function () {
  return browser.stopRunningTask();
});
