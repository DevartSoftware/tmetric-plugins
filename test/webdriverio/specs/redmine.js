
describe("Redmine", function () {

  var testProjectName = 'redmine-test-qazwsxedc';
  var testProjectUrl = 'http://demo.redmine.org/projects/redmine-test-qazwsxedc';

  var testIssueName = 'Issue for redmine-test-qazwsxedc';
  var testIssueSearchUrl = 'http://demo.redmine.org/issues?subject=Issue for redmine-test-qazwsxedc';
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
        .url('http://demo.redmine.org/projects/new')
        .setValue('#project_name', testProjectName)
        .click('input[name=commit]')
        .waitUrl('http://demo.redmine.org/projects/redmine-test-qazwsxedc/settings')
        .url(testProjectUrl)
        .then(createTestIssue);
    }

    function createTestIssue () {
      return browser
        .url('http://demo.redmine.org/projects/redmine-test-qazwsxedc/issues/new')
        .setValue('#issue_subject', testIssueName)
        .click('input[name=commit]')
        .waitForExist('.contextual .icon.icon-del')
        .url('http://demo.redmine.org/projects/redmine-test-qazwsxedc/issues')
        .then(getTestIssueUrlFromAnchor);
    }

    function checkTestIssue () {
      return browser
        .url('http://demo.redmine.org/projects/redmine-test-qazwsxedc/issues')
        .isExisting('a*=' + testIssueName).then(function (result) {
          return (result ? getTestIssueUrlFromAnchor : createTestIssue)();
        });
    }

    function checkTestProject () {
      return browser
        .url('http://demo.redmine.org/projects')
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
      .login("Redmine")
      .then(searchTestIssue)
      .then(function () {
        expect(testIssueUrl).to.be.a('string').and.not.to.be.empty;
      });

  });

  it("can start timer on an issue", function () {
    return browser
      .url(testIssueUrl)
      .waitForExist('.devart-timer-link')
      .getText('#header h1').should.eventually.be.equal(testProjectName)
      .getText('.subject h3').should.eventually.be.equal(testIssueName)
      .url().should.eventually.has.property('value', testIssueUrl)
      .startAndTestTaskStarted(testProjectName, testIssueName, testIssueUrl);
  });

  it("can stop timer on an issue", function () {
    return browser
      .url(testIssueUrl)
      .startStopAndTestTaskStopped();
  });

});
