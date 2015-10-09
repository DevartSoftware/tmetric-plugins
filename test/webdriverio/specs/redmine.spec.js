fdescribe("Redmine integration spec", function () {

  var setupError;
  var redmineUrl = 'http://demo.redmine.org';
  var testProjectUrl = '';
  var testIssueUrl = '';

  var testProjectName = 'timetracker-redmine-test';
  var testIssueName = 'Issue for timetracker-redmine-test';

  var testProjectUrl = redmineUrl + '/projects/' + testIssueName;

  beforeAll(function (done) {

    function checkTestProjectExist () {
      return browser
        .waitForExist('.projects .project')
        .elements('.projects .project')
        .isExisting('a*=' + testProjectName)
        ;
    }

    function createTestProject () {
      return browser
        .url(redmineUrl + '/projects/new')
        .waitForExist('input[name=commit]')
        .setValue('#project_name', testProjectName)
        .click('input[name=commit]')
        .waitUrl(testProjectUrl + '/settings')
        .url(testProjectUrl)
        .waitUrl(testProjectUrl)
        ;
    }

    function moveToTestProject () {
      return browser
        .elements('.projects .project')
        .click('a*=' + testProjectName)
        .waitUrl(testProjectUrl)
        ;
    }

    browser
      .login("TimeTracker")
      .login("Redmine")
      .url(redmineUrl + '/projects')
      .waitForExist('a[href="/projects/new"]')
      .then(function () {
        // all logins are successful
        // now create test project or move to already created
        return checkTestProjectExist().then(function (result) {
          if (result) {
            return moveToTestProject();
          } else {
            return createTestProject();
          }
        });
      })
      .url()
      .then(function (result) {
        testProjectUrl = result.value;
      })
      .then(done);

  });

  beforeEach(function (done) {

    function checkNoIssuesExist () {
      return browser
        .isExisting('p.nodata')
    }

    function checkTestIssueExist () {
      return browser
        .waitForExist('.list.issues .issue')
        .elements('.list.issues .issue .subject')
        .isExisting('a*=' + testIssueName)
        ;
    }

    function createTestIssue () {
      return browser
        .url(testProjectUrl + '/issues/new')
        .waitForExist('input[name=commit]')
        .setValue('#issue_subject', testIssueName)
        .click('input[name=commit]')
        .waitForExist('.devart-timer-link')
        ;
    }

    function moveToTestIssue () {
      return browser
        .elements('.list.issues .issue .subject')
        .click('a*=' + testIssueName)
        .waitForExist('.devart-timer-link')
        ;
    }

    function errorHandler (error) {
      setupError = error;
      done();
    }

    browser
      .url(testProjectUrl)
      .waitForExist('a.issues')
      .click('a.issues')
      .waitForExist('p.pagination')
      .then(function () {
        return checkNoIssuesExist().then(function (result) {
          if (result) {
            return createTestIssue();
          } else {
            return checkTestIssueExist().then(function (result) {
              if (result) {
                return moveToTestIssue();
              } else {
                return createTestIssue();
              }
            })
          }
        });
      })
      .url()
      .then(function (result) {
        testIssueUrl = result.value;
      })
      .then(done);

  });

  it("can start tracking time on a task from Redmine test project", function (done) {

    var taskName, projectName, href;

    browser
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('.subject h3').then(function (text) {
        taskName = text;
      })
      .getText('#header h1').then(function (text) {
        projectName = text;
      })
      .url()
      .then(function (result) {
        href = result.value;
      })
      .click('.devart-timer-link')
      .url('/')
      .waitForExist('.portlet-body .timer-table')
      .isVisible('#btn-stop')
      .then(function (result) {
        expect(result).toBeTruthy();
      })
      .getText('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-project")]/span').then(function (text) {
        expect(text).toBe(projectName);
      })
      .getText('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-task")]/div/div/span').then(function (text) {
        expect(text).toBe(taskName);
      })
      .getAttribute('//tr[td/div/span[contains(.,"Active")]]/td[contains(@class,"timer-td-task")]/div/a', 'href').then(function (text) {
        expect(text).toBe(href);
      })
      .then(done)
      ;

  });

  it("can stop tracking time on a task from Redmine test project", function () {

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
      .waitForExist('.portlet-body > div')
      .isVisible('#btn-stop')
      .then(function (result) {
        expect(result).toBeFalsy();
      })
      .isExisting('//tr[td/div/span[contains(.,"Active")]]')
      .then(function (result) {
        expect(result).toBeFalsy();
      })
      ;

  });

});
