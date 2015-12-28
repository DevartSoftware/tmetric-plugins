# TMetric Extensions
Extensions for Google and Firefox browsers, that integrate TMetric with popular issue tracking tools.

Supported systems:
 - [Asana](https://asana.com/)
 - [Assembla](https://www.assembla.com/)
 - [Basecamp](https://basecamp.com/)
 - [Bitbucket](https://bitbucket.org/)
 - [Bugzilla](https://www.bugzilla.org/)
 - [GitHub](https://github.com/)
 - [GitLab](https://gitlab.com/)
 - [Jira](https://www.atlassian.com/software/jira) (including Jira Agile).
 - [Jira Service Desk](https://www.atlassian.com/software/jira/service-desk)
 - [Pivotal Tracker](https://www.pivotaltracker.com/)
 - [Producteev](https://www.producteev.com/)
 - [Redmine](https://www.redmine.org/)
 - [Sprintly](https://sprint.ly/)
 - [Trac](http://trac.edgewall.org/)
 - [Teamweek](https://teamweek.com/)
 - [Teamwork](https://www.teamwork.com/)
 - [Trello](https://trello.com/)
 - [Visual Studio Online](https://www.visualstudio.com/)
 - [Waffle](https://waffle.io/)
 - [Wrike](https://www.wrike.com/)
 - [YouTrack](https://www.jetbrains.com/youtrack/)

## Installation
**Requirements**
 - [Node.js](https://nodejs.org) - JavaScript runtime built on Chrome's V8 JavaScript engine. 
 - [Git](https://git-scm.com) - free and open source distributed version control system 

Project is using [gulp](http://gulpjs.com/) as a build system.

To build and extensions from sources you need:
1. Install required `npm` packages.
2. Run `build` task on gulp.

This can be done with the following script
```sh
$ npm install
$ npm -g install gulp-cli
$ gulp build
```

If you are building on Windows you can simply run `install.bat` and `build.bat`/

Built extensions can be found in `/dist/chrome/` and `/dist/firefox/` folders.

## Running Automated Tests

**Additional Requirements**
 - [Java](https://www.java.com/download)
 
 For end-to-end automated testing project uses [Selenium 2.0](http://www.seleniumhq.org/projects/webdriver/),
 [WebdriverIO](http://webdriver.io/), and [Mocha](https://mochajs.org/).
 
**IMPORTANT:**
Before running tests you should:
1. Copy `/test/webdriverio/logins.template.js` to `/test/webdriverio/logins.conf.js`   
2. Provide valid login information for all services listed in the file.
 
To run tests simply execute `gulp test` command or run `test.bat` (only on Windows).