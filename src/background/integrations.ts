const getIntegrations = function () {
    let integrations: Integration[] = [
        {
            serviceType: 'ActiveCollab',
            serviceName: 'ActiveCollab',
            icon: '',
            origins: ['https://app.activecollab.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/activeCollab.js'],
                paths: ['projects/*'],
            }
        },
        {
            serviceType: 'Asana',
            serviceName: 'Asana',
            icon: 'asana.svg',
            origins: ['https://app.asana.com/*'],
            scripts: {
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
                js: ['in-page-scripts/integrations/assembla.js'],
                paths: ['spaces/*']
            }
        },
        {
            serviceType: 'Axosoft',
            serviceName: 'Axosoft',
            icon: 'axosoft.svg',
            origins: ['https://*.axosoft.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
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
                js: ['in-page-scripts/integrations/tfs.js'],
                paths: [
                    // Azure DevOps / Team Foundation Server
                    '_home*',
                    '_boards*',
                    '_dashboards*',
                    '_backlogs*',
                    '_workitems*',
                    '_sprints*',
                    '_queries*',
                ]
            }
        },
        {
            serviceType: 'Basecamp',
            serviceName: 'Basecamp',
            icon: 'basecamp.svg',
            origins: ['https://*.basecamp.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/basecamp.js'],
                paths: ['*/buckets/*']
            }
        },
        {
            serviceType: 'Bitbucket',
            serviceName: 'Bitbucket',
            icon: 'bitbucket.svg',
            origins: ['https://bitbucket.org/*'],
            scripts: {
                js: ['in-page-scripts/integrations/bitbucket.js'],
                paths: [
                    '*/issues/*',
                    '*/pull-requests/*'
                ]
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
                js: ['in-page-scripts/integrations/bitrix24.js'],
                paths: ['*/tasks*'],
                allFrames: true
            }
        },
        {
            serviceType: 'Bugzilla',
            serviceName: 'Bugzilla',
            icon: 'bugzilla.svg',
            origins: [],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/bugzilla.js'],
                paths: ['show_bug.cgi*'],
            }
        },
        {
            serviceType: 'ClickUp',
            serviceName: 'ClickUp',
            icon: 'clickup.svg',
            origins: ['https://app.clickup.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/clickup.js']
            }
        },
        {
            serviceType: 'Doit.im',
            serviceName: 'Doit.im',
            icon: 'doitim.svg',
            origins: ['https://i.doit.im/*'],
            scripts: {
                js: ['in-page-scripts/integrations/doitIm.js'],
                paths: ['home/*'],
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
                js: ['in-page-scripts/integrations/freshdesk.js'],
                paths: [
                    'helpdesk/tickets/*',
                    'a/tickets/*'
                ]
            }
        },
        {
            serviceType: 'GitHub',
            serviceName: 'GitHub',
            icon: 'github.svg',
            origins: ['https://github.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/gitHub.js'],
                paths: [
                    '*/issues/*',
                    '*/pull/*'
                ]
            }
        },
        {
            serviceType: 'GitLab',
            serviceName: 'GitLab',
            icon: 'gitlab.svg',
            origins: ['https://gitlab.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/gitLab.js'],
                paths: [
                    'issues/*',
                    'merge_requests/*'
                ]
            }
        },
        {
            serviceType: 'GoogleCalendar',
            serviceName: 'Google Calendar',
            icon: 'gcalendar.svg',
            origins: ['https://calendar.google.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/google-calendar.js'],
                paths: ['calendar/*']
            }
        },
        {
            serviceType: 'GoogleDocs',
            serviceName: 'Google Docs',
            icon: 'gdocs.svg',
            origins: ['https://docs.google.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/google-docs.js']
            }
        },
        {
            serviceType: 'GoogleKeep',
            serviceName: 'Google Keep',
            icon: 'gkeep.svg',
            origins: ['https://keep.google.com/*'],
            scripts: {
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
                js: ['in-page-scripts/integrations/google-mail.js'],
                paths: ['mail/*']
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
                js: ['in-page-scripts/integrations/kayako.js'],
                paths: ['agent/conversations/*']
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
                js: ['in-page-scripts/integrations/microsoft-office-online.js'],
                allFrames: true
            }
        },
        {
            serviceType: 'MicrosoftOutlookOnline',
            serviceName: 'Microsoft Outlook',
            keywords: 'email',
            icon: 'outlook.svg',
            origins: ['https://outlook.live.com/*'],
            scripts: {
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
                js: ['in-page-scripts/integrations/openProject.js'],
                paths: ['*/work_packages/*']
            }
        },
        {
            serviceType: 'Pipedrive',
            serviceName: 'Pipedrive',
            icon: 'pipedrive.svg',
            origins: ['https://*.pipedrive.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/pipedrive.js'],
                paths: ['deal/*']
            }
        },
        {
            serviceType: 'PivotalTracker',
            serviceName: 'Pivotal Tracker',
            icon: 'pivotal.svg',
            origins: ['https://www.pivotaltracker.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/pivotalTracker.js']
            }
        },
        {
            serviceType: 'Podio',
            serviceName: 'Podio',
            icon: 'podio.svg',
            origins: ['https://podio.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/podio.js'],
                paths: ['tasks/*']
            }
        },
        {
            serviceType: 'Redmine',
            serviceName: 'Redmine',
            icon: 'redmine.svg',
            keywords: 'easyredmine',
            origins: [],
            hasAdditionalOrigins: true,
            scripts: {
                js: [
                    'in-page-scripts/integrations/easyRedmine.js',
                    'in-page-scripts/integrations/redmine.js'
                ],
                paths: [
                    'issues/*',
                    'easy_crm_cases/*',
                    'test_cases/*'
                ]
            }
        },
        {
            serviceType: 'Salesforce',
            serviceName: 'Saleforce',
            icon: 'salesforce.svg',
            origins: ['https://*.lightning.force.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
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
                js: ['in-page-scripts/integrations/taiga.js'],
                paths: ['project/*']
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
                js: ['in-page-scripts/integrations/teamwork.js']
            }
        },
        {
            serviceType: 'TestLink',
            serviceName: 'TestLink',
            icon: 'testlink.svg',
            origins: [],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/testLink.js'],
                paths: [
                    'index.php*',
                    'lib/execute/execSetResults.php*'
                ],
                allFrames: true
            }
        },
        {
            serviceType: 'TestRail',
            serviceName: 'TestRail',
            icon: 'testrail.svg',
            origins: ['https://*.testrail.io/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/testRail.js'],
                paths: [
                    'index.php?/runs/view/*'
                ]
            }
        },
        {
            serviceType: 'Todoist',
            serviceName: 'Todoist',
            icon: 'todoist.svg',
            origins: ['https://todoist.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/todoist.js'],
                paths: ['app/*']
            }
        },
        {
            serviceType: 'Trac',
            serviceName: 'Trac',
            icon: 'trac.svg',
            origins: [],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/trac.js'],
                paths: ['ticket/*']
            }
        },
        {
            serviceType: 'Trello',
            serviceName: 'Trello',
            icon: 'trello.svg',
            origins: ['https://trello.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/trello.js'],
                paths: ['c/*']
            }
        },
        {
            serviceType: 'UseDesk',
            serviceName: 'Usedesk',
            icon: 'usedesk.svg',
            origins: ['https://*.usedesk.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/usedesk.js'],
                paths: ['tickets/*']
            }
        },
        {
            serviceType: 'Userecho',
            serviceName: 'UserEcho',
            icon: 'userecho.svg',
            origins: ['https://*.userecho.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
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
                js: ['in-page-scripts/integrations/uservoice.js']
            }
        },
        {
            serviceType: 'Wrike',
            serviceName: 'Wrike',
            icon: 'wrike.svg',
            origins: ['https://*.wrike.com/*'],
            scripts: {
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
                js: ['in-page-scripts/integrations/youTrack.js'],
                paths: [
                    'issue/*',
                    'agiles/*',
                    'rest/agile/*/sprint/*'
                ]
            }
        },
        {
            serviceType: 'Zammad',
            serviceName: 'Zammad',
            icon: '',
            origins: ['https://*.zammad.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/zammad.js']
            }
        },
        {
            serviceType: 'Zendesk',
            serviceName: 'Zendesk',
            icon: 'zendesk.svg',
            origins: ['https://*.zendesk.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/zendesk.js'],
                paths: ['agent/tickets/*']
            }
        },
        {
            serviceType: 'ZohoCRM',
            serviceName: 'Zoho CRM',
            icon: 'zoho.svg',
            origins: [
                'https://*.zoho.com/*',
                'https://*.zoho.eu/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/zohoCRM.js'],
                allFrames: true
            }
        },
        {
            serviceType: 'Evernote',
            serviceName: 'Evernote',
            icon: 'evernote.svg',
            origins: ['https://www.evernote.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/evernote.js']
            }
        },
        {
            serviceType: 'Monday',
            serviceName: 'Monday',
            icon: 'monday.svg',
            origins: ['https://*.monday.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/monday.js']
            }
        },
    ];
    return integrations.sort((a, b) => a.serviceName.localeCompare(b.serviceName, [], { sensitivity: 'base' }));
}