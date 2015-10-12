describe("Jira integration spec", function () {
  var setupError;
  var issueName = 'Some test task #170';
  var projectName = 'Demo';

  beforeAll(function (done) {
    browser
      .login("TimeTracker")
      .waitForVisible('.page-actions')
      .isVisible('#btn-stop')
      .then(function (isVisible) {
        if (isVisible) {
          // stop an active task
          return browser.click('#btn-stop');
        }
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
    if (setupError) {
      fail(setupError);
      return done();
    }

    var issueSelector = '.issue-link-summary=' + issueName;

    browser
      .url('https://jira.atlassian.com/browse/DEMO/issues/?filter=reportedbyme')
      .waitForExist('.loading', 5000, true)
      .isExisting(issueSelector).then(function (isExist) {
        if (!isExist) {
          // create new issue if it is not exist
          return browser
            .click('#create_link')
            .waitForExist('#create-issue-dialog #summary')
            .setValue('#summary', issueName)
            .click('#create-issue-submit')
            .waitForExist('#create-issue-dialog', 5000, true)
            .refresh()
            .waitForExist(issueSelector)
            .waitForExist('.loading', 5000, true)
        }
      })
      .click(issueSelector) // make sure that the task is selected one 
      .waitForExist('.loading', 5000, true)
      .then(done, function (error) {
        fail(error);
        done();
      });
  });

  fit("can start tracking time on a task from Atlassian's DEMO project", function (done) {
    if (setupError) {
      return fail(setupError);
    }

    var href;

    browser
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getAttribute('.issue-link', 'href')
      .then(function (text) {
        href = text;
      })
      .click('.devart-timer-link')
      .waitForExist('.devart-timer-link-stop')
      .url('/')
      .waitForExist('.timer-active')
      .getText('.timer-active div .text-overflow')
      .then(function (text) {
        expect(text).toBe(issueName);
      })
      .getText('.timer-active .timer-td-project')
      .then(function (text) {
        expect(text).toBe(projectName);
      })
      .getAttribute('.timer-active a.flex-item-no-shrink', 'href')
      .then(function (text) {
        expect(text).toBe(href);
        done();
      }, function (error) {
        fail(error);
        done();
      });
  });

  fit("can stop tracking time on a task from Atlassian's DEMO project", function (done) {
    if (setupError) {
      return fail(setupError);
    }

    browser
      .waitForExist('.devart-timer-link')
      .isExisting('.devart-timer-link-start')
      .then(function (isExist) {
        // make sure that timer is started; it will be automatically so after previous test
        if (isExist) {
          return browser
            .click('.devart-timer-link-start')
            .waitForExist('.devart-timer-link-stop');
        }
      })
      .click('.devart-timer-link-stop')
      .url('/')
      .waitForVisible('.page-actions')
      .isVisible('#btn-stop')
      .then(function (isVisible) {
        expect(isVisible).toBeFalsy();
        done();
      }, function (error) {
        fail(error);
        done();
      });
  });
}); 