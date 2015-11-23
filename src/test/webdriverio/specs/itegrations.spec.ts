describe('Extension integrates with', function () {

    before(function () {
        return browser
            .loginTimeTracker()
            .openTaskTrackerWindow();
    });

    beforeEach(function () {
        return browser
            .stopRunningTask()
            .switchToTaskTrackerWindow();
    });

    after(function () {
        return browser
            .closeTaskTrackerWindow()
            .switchToTimeTrackerWindow();
    });

    require('./github.js');
    require('./gitlab.js');
    require('./jira.js');
    require('./redmine.js');
    require('./trello.js');
});