describe("Jira Agile integration spec", function () {
  var setupError;
  var jiraAgileBoardUrl = 'https://jira.atlassian.com/secure/RapidBoard.jspa?rapidView=1309';

  beforeAll(function (done) {
    browser
      .login("TimeTracker")
      .waitForVisible('.page-actions')
      .isVisible('#btn-stop')
      .then(function (isVisible) {
        // stop an active task if needed
        if (isVisible) {
          return browser.click('#btn-stop');
        }
      })
      .then(function () {
        // all logins are successful
        done();
      }, function (error) {
        // one of the logins has failed
        setupError = error;
        done();
      });
  });

  it("can start tracking time on a task from jira agile board", function (done) {
    if (setupError) {
      fail(setupError);
      return done();
    }

    var taskName = 'Small bug that affects everyone';
    var projectName = 'Test Project with Review workflow'
    var href;

    browser
      .url(jiraAgileBoardUrl)
      .waitForExist('.ghx-issue')
      .click('.ghx-issue=' + taskName)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getAttribute('dd[data-field-id=issuekey] > a', 'href')
      .then(function (text) {
        href = text;
      })
      .click('.devart-timer-link')
      .waitForExist('devart-timer-link-stop')
      .url('/')
      .waitForExist('.timer-active')
      .getText('.timer-active div .text-overflow')
      .then(function (text) {
        expect(text).toBe(taskName);
      })
      .getText('.timer-active .timer-td-project')
      .then(function (text) {
        expect(text).toBe(projectName);
      })
      .getAttribute('.timer-active a.flex-item-no-shrink', 'href')
      .then(function (text) {
        expect(text).toBe(href);
        done();
      });
  });
}); 