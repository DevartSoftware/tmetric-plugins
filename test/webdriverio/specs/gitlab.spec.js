describe("GitLab integration spec", function () {

  var bugTrackerUrl = 'https://gitlab.com';

  var testProjectName = 'gitlab-test-qazwsxedc';
  var testProjectSearchUrl = bugTrackerUrl + '/dashboard/projects';
  var testProjectUrl = '';

  var testIssueName = 'Issue for ' + testProjectName;
  var testIssueSearchUrl = bugTrackerUrl + '/dashboard/issues?search=' + testIssueName;
  var testIssueUrl = '';

  before(function () {

    function getTestProjectUrlFromAnchor () {
      return browser
        .getAttribute('a*=' + testProjectName, 'href')
        .then(function (result) {
          testProjectUrl = result;
        });
    }

    function getTestProjectUrlFromUrl () {
      return browser
        .url()
        .then(function (result) {
          testProjectUrl = result.value;
        });
    }

    function getTestIssueUrlFromAnchor () {
      return browser
        .getAttribute('a*=' + testIssueName, 'href')
        .then(function (result) {
          testIssueUrl = result;
        });
    }

    function getTestIssueUrlFromUrl () {
      return browser
        .url()
        .then(function (result) {
          testIssueUrl = result.value;
        });
    }

    function createTestProject () {
      return browser
        .url(bugTrackerUrl + '/projects/new')
        .setValue('#project_path', testProjectName)
        .click('.btn.btn-create')
        .waitForExist('.btn.btn-remove')
        .then(getTestProjectUrlFromUrl)
        .then(createTestIssue);
    }

    function createTestIssue () {
      return browser
        .url(testProjectUrl + '/issues/new')
        .setValue('#issue_title', testIssueName)
        .click('.btn.btn-create')
        .waitForExist('.btn.btn-close.js-note-target-close')
        .then(getTestIssueUrlFromUrl);
    }

    function checkTestIssue () {
      return browser
        .url(testProjectUrl + '/issues')
        .isExisting('a*=' + testIssueName).then(function (result) {
          return (result ? getTestIssueUrlFromAnchor : createTestIssue)();
        });
    }

    function checkTestProject () {
      return browser
        .url(testProjectSearchUrl)
        .isExisting('a*=' + testProjectName)
        // .then(function (result) {
        //   return (result ? checkTestIssue : createTestProject)();
        // })
        .then(function (result) {
          return (result ? function () {
            return browser
              .then(getTestProjectUrlFromAnchor)
              .then(checkTestIssue);
          } : createTestProject)();
        });
    }

    function searchTestIssue () {
      return browser
        .url(testIssueSearchUrl)
        .isExisting('a*=' + testIssueName).then(function (result) {
          return (result ? getTestIssueUrlFromAnchor : checkTestProject)();
        });      
    }

    return browser
      .login("TimeTracker")
      .login("GitLab")
      .then(searchTestIssue)
      .then(function () {
        // expect(testProjectUrl).not.to.be.empty;
        expect(testIssueUrl).not.to.be.empty;
      });

  });
  
  // old
  // before(function (done) {

  //   function checkNoProjectExist () {
  //     return browser
  //       .isExisting('.dashboard-intro-text')
  //       ;
  //   }

  //   function checkTestProjectExist () {
  //     return browser
  //       .waitForExist('.project-row .project')
  //       .elements('.project-row .project')
  //       .isExisting('a*=' + testProjectName)
  //       ;
  //   }

  //   function createTestProject () {
  //     return browser
  //       .url(gitLabUrl + '/projects/new')
  //       .waitForExist('.btn.btn-create')
  //       .setValue('#project_path', testProjectName)
  //       .click('.btn.btn-create')
  //       .waitForExist('.btn.btn-remove')
  //       ;
  //   }

  //   function moveToTestProject () {
  //     return browser
  //       .elements('.project-row .project')
  //       .click('a*=' + testProjectName)
  //       .waitForExist('.btn.btn-remove')
  //       ;
  //   }

  //   browser
  //     .login("TimeTracker")
  //     .login("GitLab")
  //     .url(gitLabUrl + '/dashboard/projects')
  //     .waitForExist('a[href="/projects/new"]')
  //     .then(function () {
  //       // all logins are successful
  //       // now create test project or move to already created
  //       return checkNoProjectExist().then(function (result) {
  //         if (result) {
  //           return createTestProject();
  //         } else {
  //           return checkTestProjectExist().then(function (result) {
  //             if (result) {
  //               return moveToTestProject();
  //             } else {
  //               return createTestProject();
  //             }
  //           });
  //         }
  //       });
  //     })
  //     .url()
  //     .then(function (result) {
  //       testProjectUrl = result.value;
  //     })
  //     .then(done);

  // });

  // beforeEach(function (done) {

  //   function checkNoIssuesExist () {
  //     return browser
  //       .isExisting('.nothing-here-block')
  //   }

  //   function checkTestIssueExist () {
  //     return browser
  //       .waitForExist('.issues-list > .issue')
  //       .elements('.issues-list > .issue .row_title')
  //       .isExisting('a*=' + testIssueName)
  //       ;
  //   }

  //   function createTestIssue () {
  //     return browser
  //       .url(testProjectUrl + '/issues/new')
  //       .waitForExist('.btn.btn-create')
  //       .setValue('#issue_title', testIssueName)
  //       .click('.btn.btn-create')
  //       .waitForExist('.btn.btn-close.js-note-target-close')
  //       ;
  //   }

  //   function moveToTestIssue () {
  //     return browser
  //       .elements('.issues-list > .issue .row_title')
  //       .click('a*=' + testIssueName)
  //       .waitForExist('.btn.btn-close.js-note-target-close')
  //       ;
  //   }

  //   function errorHandler (error) {
  //     setupError = error;
  //     done();
  //   }

  //   browser
  //     .url(testProjectUrl)
  //     .waitForExist('.shortcuts-issues')
  //     .click('.shortcuts-issues')
  //     .waitForExist('#new_issue_link')
  //     .then(function () {
  //       return checkNoIssuesExist().then(function (result) {
  //         if (result) {
  //           return createTestIssue();
  //         } else {
  //           return checkTestIssueExist().then(function (result) {
  //             if (result) {
  //               return moveToTestIssue();
  //             } else {
  //               return createTestIssue();
  //             }
  //           })
  //         }
  //       });
  //     })
  //     .url()
  //     .then(function (result) {
  //       testIssueUrl = result.value;
  //     })
  //     .then(function () {
  //       expect(testProjectName).toBeTruthy();
  //       expect(testProjectUrl).toBeTruthy();
  //       expect(testIssueName).toBeTruthy();
  //       expect(testIssueUrl).toBeTruthy();
  //     });

  // });

  it("can start tracking time on a task from GitLab test project", function () {

    var projectName, issueName, issueUrl;

    return browser
      .url(testIssueUrl)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('.title a:nth-last-child(2)').then(function (text) {
        projectName = text;
      })
      .getText('.issue-title').then(function (text) {
        issueName = text;
      })
      .url().then(function (result) {
        issueUrl = result.value;
      })
      .then(function () {
        expect(projectName).to.be.equal(testProjectName);
        expect(issueName).to.be.equal(testIssueName);
        expect(issueUrl).to.be.equal(testIssueUrl);
      })
      .click('.devart-timer-link')
      .url('/')
      .then(function () {
        return browser.testActiveTask(projectName, issueName, issueUrl);
      });

  });

  it("can stop tracking time on a task from GitLab test project", function () {
    return browser
      .url(testIssueUrl)
      .stopAndTestTaskAbsent();
  });

});
