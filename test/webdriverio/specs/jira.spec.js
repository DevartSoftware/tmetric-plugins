describe("Jira integration spec", function () {
  var setupError;
  var demoProjectUrl = 'https://jira.atlassian.com/browse/DEMO';

  beforeAll(function (done) {
    browser
      .login("TimeTracker")
      .login("Jira").then(function () {
        // all logins are successful
        done();
      }, function (error) {
        // one of the logins has failed
        setupError = error;
        done();
      });
  });

  beforeEach(function (done) {
    browser
      .url(demoProjectUrl)
      // TODO: create Jira issue and save it
      .then(function () {
        // all setup operations are successful
        done();
      }, function (error) {
        // one of the setup operations has failed
        setupError = error;
        done();
      });
  });
  
  beforeEach(function (done) {
    browser
      .url(demoProjectUrl)
      // TODO: delete the issue created in beforeEach
      .then(function () {
        done();
      });
  });
  
  it("can start tracking time on a task from Atlassian's DEMO project", function () {
    if (setupError) {
      return fail(setupError);
    }
    
    // TODO: write actual test instead of the fake one
    return browser
      .url('/#/tracker/21/') // baseUrl from wdio.conf.js is prepended
      .getTitle().then(function (title) {
        console.log('\n\n\nTitle is: ' + title + '\n\n\n');
        fail('Not Implemented.');
      });
  });
});