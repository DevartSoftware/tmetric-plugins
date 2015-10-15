describe("Jira integration spec", function () {

  var bugTrackerUrl = 'https://jira.atlassian.com';

  var testProjectName = 'DEMO';
  var testProjectUrl = '';

  var testIssueName = 'Issue-qweasdzxc for ' + testProjectName;
  var testIssueSearchUrl = bugTrackerUrl + '/secure/QuickSearch.jspa?searchString=' + testIssueName;
  var testIssueUrl = '';

  before(function () {

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

    function createTestIssue () {
      return browser
        .url(testProjectUrl + '/secure/CreateIssue.jspa')
        .setValue('#summary', testIssueName)
        .click('#issue-create-submit')
        .waitForExist('#footer-comment-button')
        .then(getTestIssueUrlFromUrl);
    }

    function searchTestIssue () {
      return browser
        .url(testIssueSearchUrl)
        .isExisting('a*=' + testIssueName).then(function (result) {
          return (result ? getTestIssueUrlFromAnchor : createTestIssue)();
        });      
    }

    return browser
      .login("Jira")
      .then(searchTestIssue)
      .then(function () {
        expect(testIssueUrl).not.to.be.empty;
      });

  });

  it("can start tracking time on a task from Jira DEMO project", function () {

    var projectName, issueName, issueUrl;

    return browser
      .url(testIssueUrl)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('#project-name-val').then(function (text) {
        projectName = text;
      })
      .getText('#summary-val').then(function (text) {
        issueName = text;
      })
      .url().then(function (result) {
        issueUrl = result.value;
      })
      .then(function () {
        return browser.startAndTestTaskStarted(projectName, issueName, issueUrl);
      });

  });

  it("can stop tracking time on a task from Jira DEMO project", function () {
    return browser
      .url(testIssueUrl)
      .stopAndTestTaskStopped();
  });

  after(function () {
    return browser.logout("Jira");
  });

}); 
