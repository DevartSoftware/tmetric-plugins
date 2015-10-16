
before(function () {
  console.log('before');
  return browser
    .login("TimeTracker")
    .waitForVisible('.page-actions');
});

beforeEach(function () {
  console.log('beforeEach');
  return browser.stopRunningTask();
});
