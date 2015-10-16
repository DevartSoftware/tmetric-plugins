describe("Jira integration spec", function () {

  var bugTrackerUrl = 'https://jira.atlassian.com';

  var testProjectName = 'A Test Project';
  var testProjectKey = 'TST';
  var testProjectUrl = bugTrackerUrl + '/projects/' + testProjectKey;

  // var testIssueName = 'Issue-qweasdzxc for ' + testProjectName;
  var testIssueName = 'Issue-qweasdzxc for A Test Project';
  // var testIssueName = 'Issue for Test Project with Review workflow to delete';
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
        expect(projectName).to.be.equal(testProjectName);
        expect(issueName).to.be.equal(testIssueName);
        expect(issueUrl).to.be.equal(testIssueUrl);
      })
      .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);

  });

  it("can stop tracking time on a task from jira project", function () {
    return browser
      .url(testIssueUrl)
      .stopAndTestTaskStopped();
  });

  it("can start tracking time on a task from jira agile board", function () {

    var projectName, issueName, issueUrl;

    return browser
      .url(testAgileBoardUrl)
      .waitForExist('.ghx-inner=' + testIssueName)
      .click('.ghx-inner=' + testIssueName)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('.ghx-project').then(function (text) {
        projectName = text;
      })
      .getText('dd[data-field-id=summary]').then(function (text) {
        issueName = text;
      })
      .getAttribute('dd[data-field-id=issuekey] > a', 'href').then(function (value) {
        issueUrl = value;
      })
      .then(function () {
        expect(projectName).to.be.equal(testProjectName);
        expect(issueName).to.be.equal(testIssueName);
        expect(issueUrl).to.be.equal(testIssueUrl);
      })
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
