describe("Redmine integration spec", function () {

  var bugTrackerUrl = 'http://demo.redmine.org';

  var testProjectName = 'redmine-test-qazwsxedc';
  var testProjectUrl = bugTrackerUrl + '/projects/' + testProjectName;

  var testIssueName = 'Issue for ' + testProjectName;
  var testIssueSearchUrl = bugTrackerUrl + '/issues?subject=' + testIssueName;
  var testIssueUrl = '';

  before(function () {

    function getTestIssueUrlFromAnchor () {
      return browser
        .getAttribute('a*=' + testIssueName, 'href').then(function (result) {
          testIssueUrl = result;
        });
    }

    function createTestProject () {
      return browser
        .url(bugTrackerUrl + '/projects/new')
        .setValue('#project_name', testProjectName)
        .click('input[name=commit]')
        .waitUrl(testProjectUrl + '/settings')
        .url(testProjectUrl)
        .then(createTestIssue);
    }

    function createTestIssue () {
      return browser
        .url(testProjectUrl + '/issues/new')
        .setValue('#issue_subject', testIssueName)
        .click('input[name=commit]')
        .waitForExist('.contextual .icon.icon-del')
        .url(testProjectUrl + '/issues')
        .then(getTestIssueUrlFromAnchor);
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
        .url(bugTrackerUrl + '/projects')
        .isExisting('a*=' + testProjectName).then(function (result) {
          return (result ? checkTestIssue : createTestProject)();
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
      .login("Redmine")
      .then(searchTestIssue)
      .then(function () {
        // expect(testProjectUrl).not.to.be.empty;
        expect(testIssueUrl).not.to.be.empty;
      });

  });

  it("can start tracking time on a task from Redmine test project", function () {

    var projectName, issueName, issueUrl;

    return browser
      .url(testIssueUrl)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('#header h1').then(function (text) {
        projectName = text;
      })
      .getText('.subject h3').then(function (text) {
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

  it("can stop tracking time on a task from Redmine test project", function () {
    return browser
      .url(testIssueUrl)
      .stopAndTestTaskAbsent();
  });

});
