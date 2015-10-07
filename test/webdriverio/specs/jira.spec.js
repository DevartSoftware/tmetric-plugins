describe("Jira integration spec", function () {
  var setupError;
  var demoProjectUrl = 'https://jira.atlassian.com/browse/DEMO/issues/?filter=reportedbyme';

  beforeAll(function (done) {
    browser
      .login("TimeTracker").then(function () {
        // TODO: implement mechanism to determine when TT fihish its loading and uncomment following code 
        //if (browser.isExisting('#btn-stop')) {
        //  return browser.click('#btn-stop');
      })
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
      .then(function () {
        if (browser.isExisting('.issue-list > li')) {
          // all setup operations are successful
          done();
        }
        else {
          // create new task if no one is avaliable
          browser.click('#create_link')
            .waitForExist('#create-issue-dialog #summary')
            .setValue('#summary', 'Some test task')
            .click('.aui-button .aui-button-primary')
            .then(done);
        }
      }, function (error) {
        // one of the setup operations has failed
        setupError = error;
        done();
      });
  });

  it("can start tracking time on a task from Atlassian's DEMO project", function (done) {
    if (setupError) {
      return fail(setupError);
    }
    
    var taskName, projectName, href;

    browser
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('#summary-val').then(function (text) {
        taskName = text;
      })
      .getText('#project-name-val').then(function (text) {
        projectName = text;
      })
      .getAttribute('.issue-link', 'href').then(function (text) {
        href = text;
      })
      .click('.devart-timer-link')
      .url('/')
      .waitForExist('.timer-active')
      .getText('.timer-active div .text-overflow').then(function (text) {
        expect(text).toBe(taskName);
      })
      .getText('.timer-active .timer-td-project').then(function (text) {
        expect(text).toBe(projectName);
      })
      .getAttribute('.timer-active a.flex-item-no-shrink', 'href').then(function (text) {
        expect(text).toBe(href);
      })
      .then(done);
  });
}); 