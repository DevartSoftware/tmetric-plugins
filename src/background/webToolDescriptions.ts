const getWebToolDescriptions = function () {

    let items: WebToolDescription[] = [
        {
            serviceType: 'ActiveCollab',
            serviceName: 'ActiveCollab',
            icon: 'activecollab.svg',
            origins: ['https://app.activecollab.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/activeCollab.js']
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
                js: ['in-page-scripts/integrations/axosoft.js']
            }
        },
        {
            serviceType: 'Bitbucket',
            serviceName: 'Bitbucket',
            icon: 'bitbucket.svg',
            origins: ['https://bitbucket.org/*'],
            scripts: {
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
                js: ['in-page-scripts/integrations/bitrix24.js'],
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
                js: ['in-page-scripts/integrations/bugzilla.js']
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
            serviceType: 'CodaAI',
            serviceName: 'Coda AI',
            icon: 'codaai.svg',
            origins: ['https://coda.io/*'],
            scripts: {
                js: ['in-page-scripts/integrations/codaai.js'],
                allFrames: true
            }
        },
        {
            serviceType: 'Dixa',
            serviceName: 'Dixa',
            icon: 'dixa.svg',
            origins: ['https://*.dixa.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/dixa.js']
            }
        },
        {
            serviceType: 'Doit.im',
            serviceName: 'Doit.im',
            icon: 'doitim.svg',
            origins: ['https://i.doit.im/*'],
            scripts: {
                js: ['in-page-scripts/integrations/doitIm.js']
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
            serviceType: 'Figma',
            serviceName: 'Figma',
            icon: 'figma.svg',
            origins: ['https://www.figma.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/figma.js']
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
                js: ['in-page-scripts/integrations/freshdesk.js']
            }
        },
        {
            serviceType: 'GitHub',
            serviceName: 'GitHub',
            icon: 'github.svg',
            origins: ['https://github.com/*'],
            scripts: {
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
                js: ['in-page-scripts/integrations/gitLab.js']
            }
        },
        {
            serviceType: 'Gmail',
            serviceName: 'Gmail',
            keywords: 'google email',
            icon: 'gmail.svg',
            origins: ['https://mail.google.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/google-mail.js']
            }
        },
        {
            serviceType: 'GoogleCalendar',
            serviceName: 'Google Calendar',
            icon: 'gcalendar.svg',
            origins: ['https://calendar.google.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/google-calendar.js']
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
            serviceType: 'HubSpot',
            serviceName: 'HubSpot',
            icon: 'hubspot.svg',
            origins: [
                'https://app.hubspot.com/*',
                'https://app-eu1.hubspot.com/*'
            ],
            scripts: {
                js: ['in-page-scripts/integrations/hubspot.js']
            }
        },
        {
            serviceType: 'Insightly',
            serviceName: 'Insightly',
            icon: 'insightly.svg',
            origins: ['https://*.insightly.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/insightly.js']
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
            icon: 'kayako.svg',
            origins: ['https://*.kayako.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/kayako.js']
            }
        },
        {
            serviceType: 'Kissflow',
            serviceName: 'Kissflow',
            icon: 'kissflow.svg',
            origins: ['https://*.kissflow.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/kissflow.js']
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
                'https://*.sharepoint.com/*',
                'https://*.officeapps.live.com/*'
            ],
            allOriginsRequired: true,
            scripts: {
                js: ['in-page-scripts/integrations/microsoft-office-online.js'],
                allFrames: true
            }
        },
        {
            serviceType: 'MicrosoftOutlookOnline',
            serviceName: 'Microsoft Outlook',
            keywords: 'email office 365 microsoft 365',
            icon: 'outlook.svg',
            origins: [
                'https://outlook.live.com/*',
                'https://outlook.office.com/*',
                'https://outlook.office365.com/*'
            ],
            scripts: {
                js: ['in-page-scripts/integrations/microsoft-outlook-online.js']
            }
        },
        {
            serviceType: 'MicrosoftToDo',
            serviceName: 'Microsoft To Do',
            keywords: 'todo',
            icon: 'mstodo.svg',
            origins: [
                'https://to-do.live.com/*',
                'https://to-do.office.com/*'
            ],
            scripts: {
                js: ['in-page-scripts/integrations/microsoft-todo.js']
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
        {
            serviceType: 'Nifty',
            serviceName: 'Nifty',
            icon: 'nifty.svg',
            origins: ['https://*.nifty.pm/*'],
            scripts: {
                js: ['in-page-scripts/integrations/nifty.js']
            }
        },
        {
            serviceType: 'ninjaOneRmm',
            serviceName: 'ninjaOne RMM',
            icon: 'ninjaOneRmm.svg',
            origins: [
                'https://*.ninjarmm.com/*',
                'https://*.rmmservice.eu/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/ninjaOneRmm.js']
            }
        },
        {
            serviceType: 'Notion',
            serviceName: 'Notion',
            icon: 'notion.svg',
            origins: ['https://www.notion.so/*'],
            scripts: {
                js: ['in-page-scripts/integrations/notion.js']
            }
        },
        {
            serviceType: 'OpenProject',
            serviceName: 'OpenProject',
            icon: 'openproject.svg',
            origins: ['https://*.openproject.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
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
                js: ['in-page-scripts/integrations/pipedrive.js']
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
                js: ['in-page-scripts/integrations/podio.js']
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
                ]
            }
        },
        {
            serviceType: 'Salesforce',
            serviceName: 'Salesforce',
            icon: 'salesforce.svg',
            origins: ['https://*.lightning.force.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/salesforce.js']
            }
        },
        {
            serviceType: 'Shortcut',
            serviceName: 'Shortcut',
            icon: 'shortcut.svg',
            origins: ['https://app.shortcut.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/shortcut.js']
            }
        },
        {
            serviceType: 'Slack',
            serviceName: 'Slack',
            icon: 'slack.svg',
            origins: ['https://app.slack.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/slack.js']
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
                js: ['in-page-scripts/integrations/tfs.js']
            }
        },
        {
            serviceType: 'Taiga',
            serviceName: 'Taiga.io',
            icon: 'taiga.svg',
            origins: ['https://tree.taiga.io/*'],
            hasAdditionalOrigins: true,
            scripts: {
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
                js: ['in-page-scripts/integrations/teamwork.js'],
                allFrames: true
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
                js: ['in-page-scripts/integrations/testRail.js']
            }
        },
        {
            serviceType: 'TickTick',
            serviceName: 'TickTick',
            icon: 'ticktick.svg',
            origins: [
                'https://ticktick.com/*',
                'https://www.ticktick.com/*'
            ],
            scripts: {
                js: ['in-page-scripts/integrations/ticktick.js']
            }
        },
        {
            serviceType: 'Todoist',
            serviceName: 'Todoist',
            icon: 'todoist.svg',
            origins: [
                'https://todoist.com/*',
                'https://*.todoist.com/*'
            ],
            scripts: {
                js: ['in-page-scripts/integrations/todoist.js']
            }
        },
        {
            serviceType: 'Trac',
            serviceName: 'Trac',
            icon: 'trac.svg',
            origins: [],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/trac.js']
            }
        },
        {
            serviceType: 'Trello',
            serviceName: 'Trello',
            icon: 'trello.svg',
            origins: ['https://trello.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/trello.js']
            }
        },
        {
            serviceType: 'UseDesk',
            serviceName: 'UseDesk',
            icon: 'usedesk.svg',
            origins: ['https://*.usedesk.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/usedesk.js']
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
                js: ['in-page-scripts/integrations/youTrack.js']
            }
        },
        {
            serviceType: 'Zammad',
            serviceName: 'Zammad',
            icon: 'zammad.svg',
            origins: ['https://*.zammad.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/zammad.js']
            }
        },
        {
            serviceType: 'ZenHub',
            serviceName: 'ZenHub',
            icon: 'zenhub.svg',
            origins: ['https://app.zenhub.com/*'],
            scripts: {
                js: ['in-page-scripts/integrations/zenhub.js']
            }
        },
        {
            serviceType: 'Zendesk',
            serviceName: 'Zendesk',
            icon: 'zendesk.svg',
            origins: ['https://*.zendesk.com/*'],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/zendesk.js']
            }
        },
        {
            serviceType: 'ZohoCRM',
            serviceName: 'Zoho Suite',
            icon: 'zoho.svg',
            keywords: 'zoho crm zoho projects zoho desk',
            origins: [
                'https://*.zoho.com/*',
                'https://*.zoho.eu/*'
            ],
            hasAdditionalOrigins: true,
            scripts: {
                js: ['in-page-scripts/integrations/zohoCRM.js'],
                allFrames: true
            }
        }
    ];

    items = items.filter(i => i.serviceType && i.scripts);
    items.sort((a, b) => a.serviceName.localeCompare(b.serviceName, [], { sensitivity: 'base' }));

    return [...items, <WebToolDescription>{
        serviceType: 'Generic',
        serviceName: 'Generic',
        icon: 'generic.svg',
        origins: [],
        hasAdditionalOrigins: true,
        scripts: {
            js: ['in-page-scripts/integrations/generic.js']
        }
    }];
}