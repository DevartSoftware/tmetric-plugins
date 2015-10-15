describe("Jira Agile integration spec", function () {

  var bugTrackerUrl = 'https://jira.atlassian.com';
  var testIssueUrl = bugTrackerUrl + '/secure/RapidBoard.jspa?rapidView=1309&view=detail&selectedIssue=REVIEW-7';

  before(function () {
    return browser.login("Jira");
  });

  it("can start tracking time on a task from jira agile board", function () {

    var projectName = 'Test Project with Review workflow'
    var issueName = 'Small bug that affects everyone';
    var issueUrl;

    return browser
      .url(testIssueUrl)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getAttribute('dd[data-field-id=issuekey] > a', 'href').then(function (text) {
        issueUrl = text;
      })
      .then(function () {
        return browser.startAndTestTaskStarted(projectName, issueName, issueUrl);
      });

  });

  it("can stop tracking time on a task from jira agile board", function () {
    return browser
      .url(testIssueUrl)
      .stopAndTestTaskStopped();
  });

  after(function () {
    return browser.logout("Jira");
  });

});
