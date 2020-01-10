# TMetric timer extension for major Web browsers
Extension adds TMetric one-click time tracking to popular Web tools. Supported
Web browsers are **Chrome**, **Firefox**, **Edge**, and **Opera**.

## Supported services
* [ActiveCollab](https://activecollab.com/)
* [Asana](https://asana.com)
* [Assembla](https://www.assembla.com)
* [Axosoft](https://www.axosoft.com)
* [Basecamp](https://basecamp.com)
* [Bitbucket](https://bitbucket.org)
* [Bitrix24](https://www.bitrix24.com)
* [Bugzilla](https://www.bugzilla.org)
* [ClickUp](https://clickup.com)
* [Doit.im](https://doit.im)
* [Easy Redmine](https://easyredmine.com)
* [Freshdesk](https://freshdesk.com)
* [G Suite](https://gsuite.google.com)
* [GitHub](https://github.com)
* [GitLab](https://gitlab.com)
* [JIRA](https://www.atlassian.com/software/jira)
* [JIRA Service Desk](https://www.atlassian.com/software/jira/service-desk)
* [Microsoft Office Online](https://products.office.com/office-online)
* [Microsoft Outlook Online](https://outlook.live.com)
* [Megaplan](https://megaplan.ru)
* [OpenProject](https://www.openproject.org)
* [Pipedrive](https://www.pipedrive.com)
* [Pivotal Tracker](https://www.pivotaltracker.com)
* [Podio](https://podio.com)
* [Producteev](https://www.producteev.com)
* [Redmine](https://www.redmine.org)
* [Salesforce](https://www.salesforce.com)
* [Sprintly](https://sprint.ly)
* [Taiga](https://taiga.io)
* [Team Foundation Server](https://www.visualstudio.com/tfs/)
* [Teamweek](https://teamweek.com)
* [Teamwork](https://www.teamwork.com)
* [TestLink](http://testlink.org)
* [TestRail](http://www.gurock.com/testrail/)
* [Todoist](https://todoist.com)
* [Trac](https://trac.edgewall.org)
* [Trello](https://trello.com)
* [UseDesk](https://usedesk.com/)
* [UserEcho](https://userecho.com)
* [UserVoice](https://www.uservoice.com)
* [Visual Studio Online](https://www.visualstudio.com)
* [Waffle](https://waffle.io)
* [Wrike](https://www.wrike.com)
* [Wunderlist](https://www.wunderlist.com)
* [YouTrack](https://www.jetbrains.com/youtrack)
* [Zammad](https://www.zammad.com)
* [Zendesk](https://www.zendesk.com)
* [Zoho CRM](https://www.zoho.com/crm)

## Installing from Web store
* **Chrome** -  https://chrome.google.com/webstore/detail/tmetric-extension/ffijoclmniipjbhecddgkfpdafpbdnen
* **Firefox** - https://addons.mozilla.org/en-US/firefox/addon/tmetric-extension/
* **Edge** - https://www.microsoft.com/store/apps/9n4sfvphnpxr
* **Opera** - https://addons.opera.com/en/extensions/details/tmetric-extension/

## Installing from source code
**Requirements**
 - [Node.js](https://nodejs.org) - JavaScript runtime built on Chrome's V8 JavaScript engine.
 - [Git](https://git-scm.com) - free and open source distributed version control system

Project is using [gulp](https://gulpjs.com/) as a build system.

To build extensions from sources you need:
1. Install required `npm` packages.
2. Run `build` task on gulp.

This can be done with the following script
```sh
$ npm install
$ npx gulp build
```

If you are building on Windows you can simply run `build.bat`.

Built extensions can be found in `/dist/` folder.

## Basic Usage
1. Install the extension as described above.
2. Log in to your [TMetric](https;//tmetric.com) account.
3. Go to your [Web app](#supported-services) account and click
![TMetric Logo](/src/images/active19.png) **Start Timer** button there.
4. To stop the current running timer:
  * Press the button again.
  * Stop the entry from the extension icon menu.
  * Click Start Timer on another task (issue or ticket).

## Contributing
If you want to contribute, fork the project, make your changes and open a
[Pull Request](https://help.github.com/articles/creating-a-pull-request/)

Check out our wiki on
[how to add a new integration](https://github.com/DevartSoftware/tmetric-plugins/wiki/How-To:-Add-New-Integration).

Before opening a pull request please use `git squash` and merge all your commits
into one. This helps keeping the Git log more compact and clear.
