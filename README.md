# Devart Time Tracker Extensions
Extensions for Google and Firefox browsers, that integrate Devart's Time Tracker with popular issue tracking tools.

Supported systems:
 - [GitLab](https://gitlab.com/)
 - [Jira](https://www.atlassian.com/software/jira) (including Jira Agile).
 - [Jira Service Desk](https://www.atlassian.com/software/jira/service-desk)
 - [Redmine](http://www.redmine.org/)

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
Before running tests you need to provide valid login information for all services configured in
`/test/webdriverio/logins.conf.js`
 
 To run tests simply execute `gulp test` command or run `test.bat` (only on Windows).