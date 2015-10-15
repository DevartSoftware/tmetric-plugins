
before(function () {
  return browser.login("TimeTracker");
});

beforeEach(function () {
  return browser.stopRunningTask();
});
