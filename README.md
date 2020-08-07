# TMetric timer extension for major web browsers
Extension adds TMetric one-click time tracking to popular web tools. Supported
web browsers are **Chrome**, **Firefox**, **Edge**, **Opera**, and **Safari**.

## Supported services
* [ActiveCollab](https://activecollab.com/)
* [Asana](https://asana.com)
* [Assembla](https://www.assembla.com)
* [Axosoft](https://www.axosoft.com)
* [Bitbucket](https://bitbucket.org)
* [Bitrix24](https://www.bitrix24.com)
* [Bugzilla](https://www.bugzilla.org)
* [ClickUp](https://clickup.com)
* [Clubhouse](https://clubhouse.io/)
* [Doit.im](https://doit.im)
* [Easy Redmine](https://easyredmine.com)
* [Evernote](https://evernote.com)
* [Freshdesk](https://freshdesk.com)
* [G Suite](https://gsuite.google.com)
* [GitHub](https://github.com)
* [GitLab](https://gitlab.com)
* [HubSpot](https://www.hubspot.com)
* [Insightly](https://www.insightly.com/)
* [JIRA](https://www.atlassian.com/software/jira)
* [JIRA Service Desk](https://www.atlassian.com/software/jira/service-desk)
* [Kayako](http://www.kayako.com)
* [Microsoft Office Online](https://products.office.com/office-online)
* [Microsoft Outlook Online](https://outlook.live.com)
* [Microsoft To Do](https://todo.microsoft.com)
* [Monday](https://monday.com)
* [Megaplan](https://megaplan.ru)
* [Notion](https://www.notion.so)
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
* [Wrike](https://www.wrike.com)
* [Wunderlist](https://www.wunderlist.com)
* [YouTrack](https://www.jetbrains.com/youtrack)
* [Zammad](https://www.zammad.com)
* [Zendesk](https://www.zendesk.com)
* [ZenHub](https://www.zenhub.com/)
* [Zoho CRM](https://www.zoho.com/crm)

## Installing from web store
* **Chrome** -  https://chrome.google.com/webstore/detail/tmetric-extension/ffijoclmniipjbhecddgkfpdafpbdnen
* **Firefox** - https://addons.mozilla.org/en-US/firefox/addon/tmetric-extension/
* **Edge** - https://microsoftedge.microsoft.com/addons/detail/bkohhohbfioiffcejghnjljadblbifok
* **Opera** - https://addons.opera.com/en/extensions/details/tmetric-extension/
* **Safari** - https://apps.apple.com/app/tmetric-for-safari/id1483939427

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
3. Go to your [web app](#supported-services) account and click
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
