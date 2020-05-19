const getIntegrations = function () {
    return <Integration[]>[
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
            serviceName: 'Assembla',
            icon: 'assembla.svg'
        },
        {
            serviceName: 'Axosoft',
            icon: 'axosoft.svg'
        },
        {
            serviceName: 'Azure DevOps',
            icon: 'azuredevops.svg'
        },
        {
            serviceName: 'Basecamp',
            icon: 'basecamp.svg'
        },
        {
            serviceName: 'Bitbucket',
            icon: 'bitbucket.svg'
        },
        {
            serviceName: 'Bitrix24',
            icon: 'bitrix.svg'
        },
        {
            serviceName: 'Bugzilla',
            icon: 'bugzilla.svg'
        },
        {
            serviceName: 'ClickUp',
            icon: 'clickup.svg'
        },
        {
            serviceName: 'Doit.im',
            icon: 'doitim.svg'
        },
        {
            serviceName: 'Freshdesk',
            icon: 'freshdesk.svg'
        },
        {
            serviceName: 'GitHub',
            icon: 'github.svg'
        },
        {
            serviceName: 'GitLab',
            icon: 'gitlab.svg'
        },
        {
            serviceName: 'Google Calendar',
            icon: 'gcalendar.svg'
        },
        {
            serviceName: 'Google Docs',
            icon: 'gdocs.svg'
        },
        {
            serviceName: 'Google Keep',
            icon: 'gkeep.svg'
        },
        {
            serviceName: 'Gmail',
            icon: 'gmail.svg'
        },
        {
            serviceName: 'Jira',
            icon: 'jira.svg'
        },
        {
            serviceName: 'Megaplan',
            icon: 'megaplan.svg'
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
                matches: ['https://onedrive.live.com/edit*?*', 'https://*.officeapps.live.com/*'],
                js: ['in-page-scripts/integrations/microsoft-office-online.js'],
                all_frames: true
            }
        },
        {
            serviceName: 'Outlook',
            icon: 'outlook.svg'
        },
        {
            serviceName: 'OpenProject',
            icon: 'openproject.svg'
        },
        {
            serviceName: 'Pipedrive',
            icon: 'pipedrive.svg'
        },
        {
            serviceName: 'Pivotal Tracker',
            icon: 'pivotal.svg'
        },
        {
            serviceName: 'Podio',
            icon: 'podio.svg'
        },
        {
            serviceName: 'Producteev',
            icon: 'producteev.svg'
        },
        {
            serviceName: 'QuickBooks',
            icon: 'quickbooks.svg'
        },
        {
            serviceName: 'Redmine',
            icon: 'redmine.svg'
        },
        {
            serviceName: 'Saleforce',
            icon: 'salesforce.svg'
        },
        {
            serviceName: 'Sprintly',
            icon: 'sprintly.svg'
        },
        {
            serviceName: 'Taiga.io',
            icon: 'taiga.svg'
        },
        {
            serviceName: 'Teamweek',
            icon: 'teamweek.svg'
        },
        {
            serviceName: 'Teamwork',
            icon: 'teamwork.svg'
        },
        {
            serviceType: 'TestLink',
            serviceName: 'TestLink',
            icon: 'testlink.svg',
            scripts: {
                matches: ['http://testlink.datasoft.local/*'],
                js: ['in-page-scripts/integrations/testLink.js'],
                all_frames: true
            }
        },
        {
            serviceName: 'TestRail',
            icon: 'testrail.svg'
        },
        {
            serviceName: 'Visual Studio TFS',
            icon: 'vstfs.svg'
        },
        {
            serviceName: 'Todoist',
            icon: 'todoist.svg'
        },
        {
            serviceName: 'Trac',
            icon: 'trac.svg'
        },
        {
            serviceName: 'Trello',
            icon: 'trello.svg'
        },
        {
            serviceName: 'Usedesk',
            icon: 'usedesk.svg'
        },
        {
            serviceName: 'UserEcho',
            icon: 'userecho.svg'
        },
        {
            serviceName: 'UserVoice',
            icon: 'uservoice.svg'
        },
        {
            serviceName: 'Waffle',
            icon: 'waffleio.svg'
        },
        {
            serviceName: 'Wrike',
            icon: 'wrike.svg'
        },
        {
            serviceName: 'Wunderlist',
            icon: 'wunderlist.svg'
        },
        {
            serviceName: 'YouTrack',
            icon: 'youtrack.svg'
        },
        {
            serviceName: 'Zapier',
            icon: 'zapier.svg'
        },
        {
            serviceName: 'Zendesk',
            icon: 'zendesk.svg'
        },
        {
            serviceName: 'ZenHub',
            icon: 'zenhub.svg'
        },
        {
            serviceName: 'Zoho CRM',
            icon: 'zoho.svg'
        },
        {
            serviceName: 'Zenkit',
            icon: 'zenkit.svg'
        }
    ];
}
