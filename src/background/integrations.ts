const getIntegrations = function () {
    return <Integration[]>[
        {
            serviceType: 'ActiveCollab',
            serviceName: 'ActiveCollab',
            icon: '',
            scripts: {
                matches: ['https://*/projects/*'],
                js: ['in-page-scripts/integrations/activeCollab.js']
            }
        },
        {
            serviceType: 'Asana',
            serviceName: 'Asana',
            icon: 'asana.svg',
            scripts: {
                matches: ['https://app.asana.com/*'],
                js: ['in-page-scripts/integrations/asana.js']
            }
        },
        {
            serviceType: 'Assembla',
            serviceName: 'Assembla',
            icon: 'assembla.svg',
            scripts: {
                matches: ['https://*.assembla.com/spaces/*'],
                js: ['in-page-scripts/integrations/assembla.js']
            }
        },
        {
            serviceType: 'Axosoft',
            serviceName: 'Axosoft',
            icon: 'axosoft.svg',
            scripts: {
                matches: ['https://*.axosoft.com/*'],
                js: ['in-page-scripts/integrations/axosoft.js']
            }
        },
        {
            serviceType: 'TFS',
            serviceName: 'Azure DevOps',
            icon: 'azuredevops.svg',
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
            scripts: {
                matches: ['https://*.basecamp.com/*/buckets/*'],
                js: ['in-page-scripts/integrations/tfs.js']
            }
        },
        {
            serviceType: 'Bitbucket',
            serviceName: 'Bitbucket',
            icon: 'bitbucket.svg',
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
            scripts: {
                matches: ['*://*/show_bug.cgi*'],
                js: ['in-page-scripts/integrations/bugzilla.js']
            }
        },
        {
            serviceType: 'ClickUp',
            serviceName: 'ClickUp',
            icon: 'clickup.svg',
            scripts: {
                matches: ['https://app.clickup.com/*'],
                js: ['in-page-scripts/integrations/clickup.js']
            }
        },
        {
            serviceType: 'Doit.im',
            serviceName: 'Doit.im',
            icon: 'doitim.svg',
            scripts: {
                matches: ['https://i.doit.im/home/*'],
                js: ['in-page-scripts/integrations/doitIm.js']
            }
        },
        {
            serviceType: 'Freshdesk',
            serviceName: 'Freshdesk',
            icon: 'freshdesk.svg',
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
            scripts: {
                matches: ['https://calendar.google.com/calendar/*'],
                js: ['in-page-scripts/integrations/google-calendar.js']
            }
        },
        {
            serviceType: 'GoogleDocs',
            serviceName: 'Google Docs',
            icon: 'gdocs.svg',
            scripts: {
                matches: ['https://docs.google.com/*'],
                js: ['in-page-scripts/integrations/google-docs.js']
            }
        },
        {
            serviceType: 'GoogleKeep',
            serviceName: 'Google Keep',
            icon: 'gkeep.svg',
            scripts: {
                matches: ['https://keep.google.com/*'],
                js: ['in-page-scripts/integrations/google-keep.js']
            }
        },
        {
            serviceType: 'Gmail',
            serviceName: 'Gmail',
            icon: 'gmail.svg',
            scripts: {
                matches: ['https://mail.google.com/mail/*'],
                js: ['in-page-scripts/integrations/google-mail.js']
            }
        },
        {
            serviceType: 'Kayako',
            serviceName: 'Kayako',
            icon: '',
            scripts: {
                matches: ['https://*/agent/conversations/*'],
                js: ['in-page-scripts/integrations/kayako.js']
            }
        },
        {
            serviceType: 'Jira',
            serviceName: 'Jira',
            icon: 'jira.svg',
            scripts: {
                matches: ['https://*/*'],
                js: ['in-page-scripts/integrations/jira.js']
            }
        },
        {
            serviceType: 'Megaplan',
            serviceName: 'Megaplan',
            icon: 'megaplan.svg',
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
            serviceName: 'Microsoft Excel',
            icon: 'excel.svg'
        },
        {
            serviceType: 'MicrosoftOfficeOnline',
            serviceName: 'Microsoft Office',
            icon: 'msoffice.svg',
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
            serviceName: 'Outlook',
            icon: 'outlook.svg',
            scripts: {
                matches: ['https://outlook.live.com/*'],
                js: ['in-page-scripts/integrations/microsoft-outlook-online.js']
            }
        },
        {
            serviceType: 'OpenProject',
            serviceName: 'OpenProject',
            icon: 'openproject.svg',
            scripts: {
                matches: ['https://*.openproject.com/*/work_packages/*'],
                js: ['in-page-scripts/integrations/openProject.js']
            }
        },
        {
            serviceType: 'Pipedrive',
            serviceName: 'Pipedrive',
            icon: 'pipedrive.svg',
            scripts: {
                matches: ['https://*.pipedrive.com/deal/*'],
                js: ['in-page-scripts/integrations/pipedrive.js']
            }
        },
        {
            serviceType: 'PivotalTracker',
            serviceName: 'Pivotal Tracker',
            icon: 'pivotal.svg',
            scripts: {
                matches: ['https://www.pivotaltracker.com/*'],
                js: ['in-page-scripts/integrations/pivotalTracker.js']
            }
        },
        {
            serviceType: 'Podio',
            serviceName: 'Podio',
            icon: 'podio.svg',
            scripts: {
                matches: ['https://podio.com/tasks/*'],
                js: ['in-page-scripts/integrations/podio.js']
            }
        },
        {
            serviceType: 'Producteev',
            serviceName: 'Producteev',
            icon: 'producteev.svg',
            scripts: {
                matches: ['https://*.producteev.com/workspace/t/*'],
                js: ['in-page-scripts/integrations/producteev.js']
            }
        },
        {
            serviceName: 'QuickBooks',
            icon: 'quickbooks.svg'
        },
        {
            serviceType: 'Redmine',
            serviceName: 'Redmine',
            icon: 'redmine.svg',
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
            scripts: {
                matches: ['https://*.lightning.force.com/*'],
                js: ['in-page-scripts/integrations/salesforce.js']
            }
        },
        {
            serviceType: 'Sprintly',
            serviceName: 'Sprintly',
            icon: 'sprintly.svg',
            scripts: {
                matches: ['https://sprint.ly/*'],
                js: ['in-page-scripts/integrations/sprintly.js']
            }
        },
        {
            serviceType: 'Taiga',
            serviceName: 'Taiga.io',
            icon: 'taiga.svg',
            scripts: {
                matches: ['https://*/project/*'],
                js: ['in-page-scripts/integrations/taiga.js']
            }
        },
        {
            serviceType: 'Teamwork',
            serviceName: 'Teamwork',
            icon: 'teamwork.svg',
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
            scripts: {
                matches: [
                    'http://*/index.php?/runs/view/*',
                    'https://*/index.php?/runs/view/*'
                ],
                js: ['in-page-scripts/integrations/testRail.js']
            }
        },
        {
            serviceName: 'Visual Studio TFS',
            icon: 'vstfs.svg'
        },
        {
            serviceType: 'Todoist',
            serviceName: 'Todoist',
            icon: 'todoist.svg',
            scripts: {
                matches: ['https://todoist.com/app/*'],
                js: ['in-page-scripts/integrations/todoist.js']
            }
        },
        {
            serviceType: 'Trac',
            serviceName: 'Trac',
            icon: 'trac.svg',
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
            scripts: {
                matches: ['https://trello.com/c/*'],
                js: ['in-page-scripts/integrations/trello.js']
            }
        },
        {
            serviceType: 'UseDesk',
            serviceName: 'Usedesk',
            icon: 'usedesk.svg',
            scripts: {
                matches: ['https://*.usedesk.com/tickets/*'],
                js: ['in-page-scripts/integrations/usedesk.js']
            }
        },
        {
            serviceType: 'Userecho',
            serviceName: 'UserEcho',
            icon: 'userecho.svg',
            scripts: {
                matches: ['https://*.userecho.com/*'],
                js: ['in-page-scripts/integrations/userecho.js']
            }
        },
        {
            serviceType: 'UserVoice',
            serviceName: 'UserVoice',
            icon: 'uservoice.svg',
            scripts: {
                matches: ['https://*.uservoice.com/*'],
                js: ['in-page-scripts/integrations/uservoice.js']
            }
        },
        {
            serviceType: 'Wrike',
            serviceName: 'Wrike',
            icon: 'wrike.svg',
            scripts: {
                matches: ['https://*.wrike.com/*'],
                js: ['in-page-scripts/integrations/wrike.js']
            }
        },
        {
            serviceType: 'YouTrack',
            serviceName: 'YouTrack',
            icon: 'youtrack.svg',
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
            scripts: {
                matches: ['https://*/*'],
                js: ['in-page-scripts/integrations/zammad.js']
            }
        },
        {
            serviceName: 'Zapier',
            icon: 'zapier.svg'
        },
        {
            serviceType: 'Zendesk',
            serviceName: 'Zendesk',
            icon: 'zendesk.svg',
            scripts: {
                matches: ['https://*.zendesk.com/agent/tickets/*'],
                js: ['in-page-scripts/integrations/zendesk.js']
            }
        },
        {
            serviceName: 'ZenHub',
            icon: 'zenhub.svg'
        },
        {
            serviceType: 'ZohoCRM',
            serviceName: 'Zoho CRM',
            icon: 'zoho.svg',
            scripts: {
                matches: ['https://*/*'],
                js: ['in-page-scripts/integrations/zohoCRM.js'],
                all_frames: true
            }
        },
        {
            serviceName: 'Zenkit',
            icon: 'zenkit.svg'
        },
        {
            serviceType: 'MicrosoftToDo',
            serviceName: 'Microsoft ToDo',
            icon: 'mstodo.svg',
            scripts: {
                matches: ['https://to-do.live.com/*'],
                js: ['in-page-scripts/integrations/microsoft-todo.js']
            }
        }
    ];
}