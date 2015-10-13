describe("GitLab integration spec", function () {

  var setupError;
  var gitLabUrl = 'https://gitlab.com';
  var testProjectUrl = '';
  var testIssueUrl = '';

  var testProjectName = 'timetracker-gitlab-test';
  var testIssueName = 'Issue for timetracker-gitlab-test';

  beforeAll(function (done) {

    function checkNoProjectExist () {
      return browser
        .isExisting('.dashboard-intro-text')
        ;
    }

    function checkTestProjectExist () {
      return browser
        .waitForExist('.project-row .project')
        .elements('.project-row .project')
        .isExisting('a*=' + testProjectName)
        ;
    }

    function createTestProject () {
      return browser
        .url(gitLabUrl + '/projects/new')
        .waitForExist('.btn.btn-create')
        .setValue('#project_path', testProjectName)
        .click('.btn.btn-create')
        .waitForExist('.btn.btn-remove')
        ;
    }

    function moveToTestProject () {
      return browser
        .elements('.project-row .project')
        .click('a*=' + testProjectName)
        .waitForExist('.btn.btn-remove')
        ;
    }

    browser
      .login("TimeTracker")
      .login("GitLab")
      .url(gitLabUrl + '/dashboard/projects')
      .waitForExist('a[href="/projects/new"]')
      .then(function () {
        // all logins are successful
        // now create test project or move to already created
        return checkNoProjectExist().then(function (result) {
          if (result) {
            return createTestProject();
          } else {
            return checkTestProjectExist().then(function (result) {
              if (result) {
                return moveToTestProject();
              } else {
                return createTestProject();
              }
            });
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
        .isExisting('.nothing-here-block')
    }

    function checkTestIssueExist () {
      return browser
        .waitForExist('.issues-list > .issue')
        .elements('.issues-list > .issue .row_title')
        .isExisting('a*=' + testIssueName)
        ;
    }

    function createTestIssue () {
      return browser
        .url(testProjectUrl + '/issues/new')
        .waitForExist('.btn.btn-create')
        .setValue('#issue_title', testIssueName)
        .click('.btn.btn-create')
        .waitForExist('.btn.btn-close.js-note-target-close')
        ;
    }

    function moveToTestIssue () {
      return browser
        .elements('.issues-list > .issue .row_title')
        .click('a*=' + testIssueName)
        .waitForExist('.btn.btn-close.js-note-target-close')
        ;
    }

    function errorHandler (error) {
      setupError = error;
      done();
    }

    browser
      .url(testProjectUrl)
      .waitForExist('.shortcuts-issues')
      .click('.shortcuts-issues')
      .waitForExist('#new_issue_link')
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

  it("can start tracking time on a task from GitLab test project", function (done) {

    var taskName, projectName, href;

    browser
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('.issue-title').then(function (text) {
        taskName = text;
      })
      .getText('.title a:nth-last-child(2)').then(function (text) {
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

  it("can stop tracking time on a task from GitLab test project", function () {

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
