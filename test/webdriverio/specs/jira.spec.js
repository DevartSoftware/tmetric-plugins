describe("Jira integration spec", function () {

  var bugTrackerUrl = 'https://jira.atlassian.com';

  var testProjectName = 'A Test Project';
  var testProjectKey = 'TST';
  var testProjectUrl = bugTrackerUrl + '/projects/' + testProjectKey;

  var testIssueName = 'Issue-qweasdzxc for ' + testProjectName;
  var testIssueSearchUrl = bugTrackerUrl + '/secure/QuickSearch.jspa?searchString=' + testIssueName;
  var testIssueUrl = '';

  var testAgileBoardUrl = bugTrackerUrl + '/secure/RapidBoard.jspa?projectName=' + testProjectName;
  var testAgileBoardSprintName = 'Sprint 1';

  before(function () {

    return browser
      .login("Jira")
      .url(testIssueSearchUrl)
      .isExisting('//span[contains(@class,"issue-link-summary")][text()="' + testIssueName + '"]').then(function (result) {
        return result ?
          browser
            .getAttribute('//a[span[contains(@class,"issue-link-summary")][text()="' + testIssueName + '"]]', 'href').then(function (result) {
              testIssueUrl = result;
            }) :
          browser
            .url(testProjectUrl)
            .waitForExist('#create_link')
            .click('#create_link')
            .waitForExist('#create-issue-submit')
            .setValue('#summary', testIssueName)
            .setValue('//div[label[text()="Sprint"]]//input', testAgileBoardSprintName)
            .waitForExist('//div[label[text()="Sprint"]]//input[@aria-expanded="true"]')
            .keys('\uE007')
            .click('#create-issue-submit')
            .waitForExist('.ghx-inner=' + testIssueName)
            .getAttribute('//div[div/span[text()="' + testIssueName + '"]]//a[@class="js-key-link"]', 'href').then(function (result) {
              testIssueUrl = result;
            });
      })
      .then(function () {
        expect(testIssueUrl).not.to.be.empty;
      });

  });

  it("can start tracking time on a task from jira project", function () {
    return browser
      .url(testIssueUrl)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .testText('#project-name-val', testProjectName)
      .testText('#summary-val', testIssueName)
      .testUrl(testIssueUrl)
      .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
  });

  it("can stop tracking time on a task from jira project", function () {
    return browser
      .url(testIssueUrl)
      .stopAndTestTaskStopped();
  });

  it("can start tracking time on a task from jira agile board", function () {
    return browser
      .url(testAgileBoardUrl)
      .waitForExist('.ghx-inner=' + testIssueName)
      .click('.ghx-inner=' + testIssueName)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .testText('.ghx-project', testProjectName)
      .testText('dd[data-field-id=summary]', testIssueName)
      .testAttribute('dd[data-field-id=issuekey] > a', 'href', testIssueUrl)
      .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
  });

  it("can stop tracking time on a task from jira agile board", function () {
    return browser
      .url(testAgileBoardUrl)
      .waitForExist('.ghx-inner=' + testIssueName)
      .click('.ghx-inner=' + testIssueName)
      .stopAndTestTaskStopped();
  });

}); 
