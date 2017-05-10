# TMetric Extensions
Extensions for Google and Firefox browsers, that integrate TMetric with popular issue tracking tools.

Supported systems: [Asana](https://asana.com/), [Assembla](https://www.assembla.com/), [Axosoft](https://www.axosoft.com/), [Basecamp](https://basecamp.com/), [Bitbucket](https://bitbucket.org/), [Bugzilla](https://www.bugzilla.org/), [Freshdesk](https://freshdesk.com/), [GitHub](https://github.com/), [GitLab](https://gitlab.com/), [Jira](https://www.atlassian.com/software/jira), [Jira Service Desk](https://www.atlassian.com/software/jira/service-desk), [Pivotal Tracker](https://www.pivotaltracker.com/), [Producteev](https://www.producteev.com/), [Redmine](https://www.redmine.org/), [Sprintly](https://sprint.ly/), [Teamweek](https://teamweek.com/), [Teamwork](https://www.teamwork.com/), [TestLink](http://testlink.org/), [Todoist](https://todoist.com), [Trac](https://trac.edgewall.org/), [Trello](https://trello.com/), [UserEcho](http://userecho.com/), [UserVoice](https://www.uservoice.com/), [Visual Studio Online](https://www.visualstudio.com/), [Waffle](https://waffle.io/), [Wrike](https://www.wrike.com/), [Wunderlist](https://www.wunderlist.com/), [YouTrack](https://www.jetbrains.com/youtrack/), [Zendesk](https://www.zendesk.com).

## Installation
**Requirements**
 - [Node.js](https://nodejs.org) - JavaScript runtime built on Chrome's V8 JavaScript engine. 
 - [Git](https://git-scm.com) - free and open source distributed version control system 

Project is using [gulp](http://gulpjs.com/) as a build system.

To build extensions from sources you need:
1. Install required `npm` packages.
2. Run `build` task on gulp.

This can be done with the following script
```sh
$ npm install
$ npm update jpm
$ npm -g install gulp-cli
$ npm -g install typescript@1.8.x
$ gulp build
```

If you are building on Windows you can simply run `install.bat` and `build.bat`.

Built extensions can be found in `/dist/chrome/` and `/dist/firefox/` folders.
