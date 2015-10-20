describe.skip("Jira", function () {

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

  it("can start timer on an issue", function () {
    return browser
      .url(testIssueUrl)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('#project-name-val').should.eventually.be.equal(testProjectName)
      .getText('#summary-val').should.eventually.be.equal(testIssueName)
      .url().should.eventually.has.property('value', testIssueUrl)
      .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
  });

  it("can stop timer on an issue", function () {
    return browser
      .url(testIssueUrl)
      .stopAndTestTaskStopped();
  });

  it("can start timer on an issue from agile board", function () {
    return browser
      .url(testAgileBoardUrl)
      .waitForExist('.ghx-inner=' + testIssueName)
      .click('.ghx-inner=' + testIssueName)
      .waitForExist('.devart-timer-link.devart-timer-link-start')
      .getText('.ghx-project').should.eventually.be.equal(testProjectName)
      .getText('dd[data-field-id=summary]').should.eventually.be.equal(testIssueName)
      .getAttribute('dd[data-field-id=issuekey] > a', 'href').should.eventually.be.equal(testIssueUrl)
      .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
  });

  it("can stop timer on an issue from agile board", function () {
    return browser
      .url(testAgileBoardUrl)
      .waitForExist('.ghx-inner=' + testIssueName)
      .click('.ghx-inner=' + testIssueName)
      .stopAndTestTaskStopped();
  });

}); 
