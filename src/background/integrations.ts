const getIntegrations = function () {
    return <Integration[]>[
        {
            serviceType: 'ActiveCollab',
            serviceName: 'ActiveCollab',
            icon: '',
            origins: ['https://app.activecollab.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*/projects/*'],
                js: ['in-page-scripts/integrations/activeCollab.js']
            }
        },
        {
            serviceType: 'Asana',
            serviceName: 'Asana',
            icon: 'asana.svg',
            origins: ['https://app.asana.com/*'],
            scripts: {
                matches: ['https://app.asana.com/*'],
                js: ['in-page-scripts/integrations/asana.js']
            }
        },
        {
            serviceType: 'Assembla',
            serviceName: 'Assembla',
            icon: 'assembla.svg',
            origins: ['https://*.assembla.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.assembla.com/spaces/*'],
                js: ['in-page-scripts/integrations/assembla.js']
            }
        },
        {
            serviceType: 'Axosoft',
            serviceName: 'Axosoft',
            icon: 'axosoft.svg',
            origins: ['https://*.axosoft.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.axosoft.com/*'],
                js: ['in-page-scripts/integrations/axosoft.js']
            }
        },
        {
            serviceType: 'TFS',
            serviceName: 'Azure DevOps',
            keywords: 'microsoft tfs visual studio team foundation server',
            icon: 'azuredevops.svg',
            origins: [
                'https://*.visualstudio.com/*',
                'https://dev.azure.com/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    // Visual Studio Team Services
                    '*://*.visualstudio.com/*',
                    // Azure DevOps / Team Foundation Server
                    '*://*/_home*',
                    '*://*/_boards*',
                    '*://*/_dashboards*',
                    '*://*/_backlogs*',
                    '*://*/_workitems*',
                    '*://*/_sprints*',
                    '*://*/_queries*',
                ],
                js: ['in-page-scripts/integrations/tfs.js']
            }
        },
        {
            serviceType: 'Basecamp',
            serviceName: 'Basecamp',
            icon: 'basecamp.svg',
            origins: ['https://*.basecamp.com/*'],
            scripts: {
                matches: ['https://*.basecamp.com/*/buckets/*'],
                js: ['in-page-scripts/integrations/tfs.js']
            }
        },
        {
            serviceType: 'Bitbucket',
            serviceName: 'Bitbucket',
            icon: 'bitbucket.svg',
            origins: ['https://bitbucket.org/*'],
            scripts: {
                matches: [
                    'https://bitbucket.org/*/issues/*',
                    'https://bitbucket.org/*/pull-requests/*'
                ],
                js: ['in-page-scripts/integrations/bitbucket.js']
            }
        },
        {
            serviceType: 'Bitrix24',
            serviceName: 'Bitrix24',
            icon: 'bitrix.svg',
            keywords: 'битрикс24 бітрікс24 бітрыкс24',
            origins: [
                'https://*.bitrix24.com/*',
                'https://*.bitrix24.ru/*',
                'https://*.bitrix24.eu/*',
                'https://*.bitrix24.de/*',
                'https://*.bitrix24.ua/*',
                'https://*.bitrix24.by/*',
                'https://*.bitrix24.fr/*',
                'https://*.bitrix24.it/*',
                'https://*.bitrix24.pl/*',
                'https://*.bitrix24.kz/*',
                'https://*.bitrix24.in/*',
                'https://*.bitrix24.com.tr/*',
                'https://*.bitrix24.id/*',
                'https://*.bitrix24.cn/*',
                'https://*.bitrix24.vn/*',
                'https://*.bitrix24.jp/*',
                'https://*.bitrix24.es/*',
                'https://*.bitrix24.com.br/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*/*/tasks*'],
                js: ['in-page-scripts/integrations/bitrix24.js'],
                all_frames: true
            }
        },
        {
            serviceType: 'Bugzilla',
            serviceName: 'Bugzilla',
            icon: 'bugzilla.svg',
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['*://*/show_bug.cgi*'],
                js: ['in-page-scripts/integrations/bugzilla.js']
            }
        },
        {
            serviceType: 'ClickUp',
            serviceName: 'ClickUp',
            icon: 'clickup.svg',
            origins: ['https://app.clickup.com/*'],
            scripts: {
                matches: ['https://app.clickup.com/*'],
                js: ['in-page-scripts/integrations/clickup.js']
            }
        },
        {
            serviceType: 'Doit.im',
            serviceName: 'Doit.im',
            icon: 'doitim.svg',
            origins: ['https://i.doit.im/*'],
            scripts: {
                matches: ['https://i.doit.im/home/*'],
                js: ['in-page-scripts/integrations/doitIm.js']
            }
        },
        {
            serviceType: 'Freshdesk',
            serviceName: 'Freshdesk',
            icon: 'freshdesk.svg',
            origins: [
                'https://*.freshdesk.com/*',
                'https://*.freshservice.com/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    '*://*/helpdesk/tickets/*',
                    '*://*/a/tickets/*'
                ],
                js: ['in-page-scripts/integrations/freshdesk.js']
            }
        },
        {
            serviceType: 'GitHub',
            serviceName: 'GitHub',
            icon: 'github.svg',
            origins: ['https://github.com/*'],
            scripts: {
                matches: [
                    'https://github.com/*/issues/*',
                    'https://github.com/*/pull/*'
                ],
                js: ['in-page-scripts/integrations/gitHub.js']
            }
        },
        {
            serviceType: 'GitLab',
            serviceName: 'GitLab',
            icon: 'gitlab.svg',
            origins: ['https://gitlab.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    '*://*/issues/*',
                    '*://*/merge_requests/*'
                ],
                js: ['in-page-scripts/integrations/gitLab.js']
            }
        },
        {
            serviceType: 'GoogleCalendar',
            serviceName: 'Google Calendar',
            icon: 'gcalendar.svg',
            origins: ['https://calendar.google.com/*'],
            scripts: {
                matches: ['https://calendar.google.com/calendar/*'],
                js: ['in-page-scripts/integrations/google-calendar.js']
            }
        },
        {
            serviceType: 'GoogleDocs',
            serviceName: 'Google Docs',
            icon: 'gdocs.svg',
            origins: ['https://docs.google.com/*'],
            scripts: {
                matches: ['https://docs.google.com/*'],
                js: ['in-page-scripts/integrations/google-docs.js']
            }
        },
        {
            serviceType: 'GoogleKeep',
            serviceName: 'Google Keep',
            icon: 'gkeep.svg',
            origins: ['https://keep.google.com/*'],
            scripts: {
                matches: ['https://keep.google.com/*'],
                js: ['in-page-scripts/integrations/google-keep.js']
            }
        },
        {
            serviceType: 'Gmail',
            serviceName: 'Gmail',
            keywords: 'google email',
            icon: 'gmail.svg',
            origins: ['https://mail.google.com/*'],
            scripts: {
                matches: ['https://mail.google.com/mail/*'],
                js: ['in-page-scripts/integrations/google-mail.js']
            }
        },
        {
            serviceType: 'Jira',
            serviceName: 'Jira',
            icon: 'jira.svg',
            keywords: 'atlassian',
            origins: [
                'https://*.atlassian.com/*',
                'https://*.atlassian.net/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*/*'],
                js: ['in-page-scripts/integrations/jira.js']
            }
        },
        {
            serviceType: 'Kayako',
            serviceName: 'Kayako',
            icon: '',
            origins: ['https://*.kayako.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*/agent/conversations/*'],
                js: ['in-page-scripts/integrations/kayako.js']
            }
        },
        {
            serviceType: 'Megaplan',
            serviceName: 'Megaplan',
            icon: 'megaplan.svg',
            keywords: 'мегаплан',
            origins: [
                'https://*.megaplan.ru/*',
                'https://*.megaplan.ua/*',
                'https://*.megaplan.by/*',
                'https://*.megaplan.kz/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    'https://*.megaplan.ru/*',
                    'https://*.megaplan.ua/*',
                    'https://*.megaplan.by/*',
                    'https://*.megaplan.kz/*'
                ],
                js: ['in-page-scripts/integrations/megaplan.js']
            }
        },
        {
            serviceType: 'MicrosoftOfficeOnline',
            serviceName: 'Microsoft Office',
            icon: 'msoffice.svg',
            keywords: 'excel word powerpoint office 365 microsoft 365',
            origins: [
                'https://onedrive.live.com/*',
                'https://*.officeapps.live.com/*'
            ],
            scripts: {
                matches: [
                    'https://onedrive.live.com/edit*',
                    'https://*.officeapps.live.com/*'
                ],
                js: ['in-page-scripts/integrations/microsoft-office-online.js'],
                all_frames: true
            }
        },
        {
            serviceType: 'MicrosoftOutlookOnline',
            serviceName: 'Microsoft Outlook',
            keywords: 'email',
            icon: 'outlook.svg',
            origins: ['https://outlook.live.com/*'],
            scripts: {
                matches: ['https://outlook.live.com/*'],
                js: ['in-page-scripts/integrations/microsoft-outlook-online.js']
            }
        },
        {
            serviceType: 'OpenProject',
            serviceName: 'OpenProject',
            icon: 'openproject.svg',
            origins: ['https://*.openproject.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.openproject.com/*/work_packages/*'],
                js: ['in-page-scripts/integrations/openProject.js']
            }
        },
        {
            serviceType: 'Pipedrive',
            serviceName: 'Pipedrive',
            icon: 'pipedrive.svg',
            origins: ['https://*.pipedrive.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.pipedrive.com/deal/*'],
                js: ['in-page-scripts/integrations/pipedrive.js']
            }
        },
        {
            serviceType: 'PivotalTracker',
            serviceName: 'Pivotal Tracker',
            icon: 'pivotal.svg',
            origins: ['https://www.pivotaltracker.com/*'],
            scripts: {
                matches: ['https://www.pivotaltracker.com/*'],
                js: ['in-page-scripts/integrations/pivotalTracker.js']
            }
        },
        {
            serviceType: 'Podio',
            serviceName: 'Podio',
            icon: 'podio.svg',
            origins: ['https://podio.com/*'],
            scripts: {
                matches: ['https://podio.com/tasks/*'],
                js: ['in-page-scripts/integrations/podio.js']
            }
        },
        {
            serviceType: 'Redmine',
            serviceName: 'Redmine',
            icon: 'redmine.svg',
            keywords: 'easyredmine',
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    'https://*/issues/*',
                    'https://*/easy_crm_cases/*',
                    'https://*/test_cases/*'
                ],
                js: [
                    'in-page-scripts/integrations/easyRedmine.js',
                    'in-page-scripts/integrations/redmine.js'
                ],
            }
        },
        {
            serviceType: 'Salesforce',
            serviceName: 'Saleforce',
            icon: 'salesforce.svg',
            origins: ['https://*.lightning.force.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.lightning.force.com/*'],
                js: ['in-page-scripts/integrations/salesforce.js']
            }
        },
        {
            serviceType: 'Sprintly',
            serviceName: 'Sprintly',
            icon: 'sprintly.svg',
            keywords: 'sprint.ly',
            origins: ['https://sprint.ly/*'],
            scripts: {
                matches: ['https://sprint.ly/*'],
                js: ['in-page-scripts/integrations/sprintly.js']
            }
        },
        {
            serviceType: 'Taiga',
            serviceName: 'Taiga.io',
            icon: 'taiga.svg',
            origins: ['https://tree.taiga.io/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*/project/*'],
                js: ['in-page-scripts/integrations/taiga.js']
            }
        },
        {
            serviceType: 'Teamwork',
            serviceName: 'Teamwork',
            icon: 'teamwork.svg',
            origins: [
                'https://*.teamwork.com/*',
                'https://*.teamworkpm.net/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    'https://*.teamwork.com/*',
                    'https://*.seetodos.com/*',
                    'https://*.companytodos.com/*',
                    'https://*.worktodos.com/*',
                    'https://*.companyworkflow.com/*',
                    'https://*.projectgameplan.com/*',
                    'https://*.peopleworkflow.com/*',
                    'https://*.projecttodos.com/*',
                    'https://*.projectorganiser.com/*',
                    'https://*.seetasks.com/*',
                    'https://*.teamworkpm.net/*'
                ],
                js: ['in-page-scripts/integrations/teamwork.js']
            }
        },
        {
            serviceType: 'TestLink',
            serviceName: 'TestLink',
            icon: 'testlink.svg',
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    'http://*/index.php*',
                    'https://*/index.php*',
                    'http://*/lib/execute/execSetResults.php*',
                    'https://*/lib/execute/execSetResults.php*'
                ],
                js: ['in-page-scripts/integrations/testLink.js'],
                all_frames: true
            }
        },
        {
            serviceType: 'TestRail',
            serviceName: 'TestRail',
            icon: 'testrail.svg',
            origins: ['https://*.testrail.io/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    'http://*/index.php?/runs/view/*',
                    'https://*/index.php?/runs/view/*'
                ],
                js: ['in-page-scripts/integrations/testRail.js']
            }
        },
        {
            serviceType: 'Todoist',
            serviceName: 'Todoist',
            icon: 'todoist.svg',
            origins: ['https://todoist.com/*'],
            scripts: {
                matches: ['https://todoist.com/app/*'],
                js: ['in-page-scripts/integrations/todoist.js']
            }
        },
        {
            serviceType: 'Trac',
            serviceName: 'Trac',
            icon: 'trac.svg',
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    'http://*/ticket/*',
                    'https://*/ticket/*'
                ],
                js: ['in-page-scripts/integrations/trac.js']
            }
        },
        {
            serviceType: 'Trello',
            serviceName: 'Trello',
            icon: 'trello.svg',
            matches: ['https://trello.com/*'],
            scripts: {
                matches: ['https://trello.com/c/*'],
                js: ['in-page-scripts/integrations/trello.js']
            }
        },
        {
            serviceType: 'UseDesk',
            serviceName: 'Usedesk',
            icon: 'usedesk.svg',
            origins: ['https://*.usedesk.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.usedesk.com/tickets/*'],
                js: ['in-page-scripts/integrations/usedesk.js']
            }
        },
        {
            serviceType: 'Userecho',
            serviceName: 'UserEcho',
            icon: 'userecho.svg',
            origins: ['https://*.userecho.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.userecho.com/*'],
                js: ['in-page-scripts/integrations/userecho.js']
            }
        },
        {
            serviceType: 'UserVoice',
            serviceName: 'UserVoice',
            icon: 'uservoice.svg',
            origins: ['https://*.uservoice.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.uservoice.com/*'],
                js: ['in-page-scripts/integrations/uservoice.js']
            }
        },
        {
            serviceType: 'Wrike',
            serviceName: 'Wrike',
            icon: 'wrike.svg',
            origins: ['https://*.wrike.com/*'],
            scripts: {
                matches: ['https://*.wrike.com/*'],
                js: ['in-page-scripts/integrations/wrike.js']
            }
        },
        {
            serviceType: 'YouTrack',
            serviceName: 'YouTrack',
            icon: 'youtrack.svg',
            origins: ['https://*.myjetbrains.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: [
                    'https://*/issue/*',
                    'https://*/agiles/*',
                    'https://*/rest/agile/*/sprint/*'
                ],
                js: ['in-page-scripts/integrations/youTrack.js']
            }
        },
        {
            serviceType: 'Zammad',
            serviceName: 'Zammad',
            icon: '',
            origins: ['https://*.zammad.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*/*'],
                js: ['in-page-scripts/integrations/zammad.js']
            }
        },
        {
            serviceType: 'Zendesk',
            serviceName: 'Zendesk',
            icon: 'zendesk.svg',
            matches: ['https://*.zendesk.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*.zendesk.com/agent/tickets/*'],
                js: ['in-page-scripts/integrations/zendesk.js']
            }
        },
        {
            serviceType: 'ZohoCRM',
            serviceName: 'Zoho CRM',
            icon: 'zoho.svg',
            matches: [
                'https://*.zoho.com/*',
                'https://*.zoho.eu/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                matches: ['https://*/*'],
                js: ['in-page-scripts/integrations/zohoCRM.js'],
                all_frames: true
            }
        },
        {
            serviceType: 'Monday',
            serviceName: 'Monday',
            icon: 'monday.svg',
            scripts: {
                matches: ['https://*.monday.com/*'],
                js: ['in-page-scripts/integrations/monday.js']
            }
        },
    ];
}