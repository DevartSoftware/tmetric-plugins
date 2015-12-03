require('./common.spec.js');

describe('Extension integrates with', function () {

    before(function () {
        return browser
            .loginTimeTracker();
    });

    beforeEach(function () {
        return browser
            .stopRunningTask()
            .switchToTaskTrackerWindow();
    });

    after(function () {
        return browser
            .switchToTimeTrackerWindow();
    });

    require('./github.js');
    require('./gitlab.js');
    require('./jira.js');
    require('./redmine.js');
    require('./tfs.js');
    require('./trello.js');
});