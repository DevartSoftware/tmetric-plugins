const integrations = <IntegrationInfo[]>[
    {
        serviceName: "Asana",
        icon: "asana.svg"
    },
    {
        serviceName: "Assembla",
        icon: "assembla.svg"
    },
    {
        serviceName: "Axosoft",
        icon: "axosoft.svg"
    },
    {
        serviceName: "Azure DevOps",
        icon: "azuredevops.svg"
    },
    {
        serviceName: "Basecamp",
        icon: "basecamp.svg"
    },
    {
        serviceName: "Bitbucket",
        icon: "bitbucket.svg"
    },
    {
        serviceName: "Bitrix24",
        icon: "bitrix.svg"
    },
    {
        serviceName: "Bugzilla",
        icon: "bugzilla.svg"
    },
    {
        serviceName: "ClickUp",
        icon: "clickup.svg"
    },
    {
        serviceName: "Doit.im",
        icon: "doitim.svg"
    },
    {
        serviceName: "Freshdesk",
        icon: "freshdesk.svg"
    },
    {
        serviceName: "GitHub",
        icon: "github.svg"
    },
    {
        serviceName: "GitLab",
        icon: "gitlab.svg"
    },
    {
        serviceName: "Google Calendar",
        icon: "gcalendar.svg"
    },
    {
        serviceName: "Google Docs",
        icon: "gdocs.svg"
    },
    {
        serviceName: "Google Keep",
        icon: "gkeep.svg"
    },
    {
        serviceName: "Gmail",
        icon: "gmail.svg"
    },
    {
        serviceName: "Jira",
        icon: "jira.svg"
    },
    {
        serviceName: "Megaplan",
        icon: "megaplan.svg"
    },
    {
        serviceName: "Microsoft Excel",
        icon: "excel.svg"
    },
    {
        serviceName: "Microsoft Office",
        icon: "msoffice.svg"
    },
    {
        serviceName: "Outlook",
        icon: "outlook.svg"
    },
    {
        serviceName: "OpenProject",
        icon: "openproject.svg"
    },
    {
        serviceName: "Pipedrive",
        icon: "pipedrive.svg"
    },
    {
        serviceName: "Pivotal Tracker",
        icon: "pivotal.svg"
    },
    {
        serviceName: "Podio",
        icon: "podio.svg"
    },
    {
        serviceName: "Producteev",
        icon: "producteev.svg"
    },
    {
        serviceName: "QuickBooks",
        icon: "quickbooks.svg"
    },
    {
        serviceName: "Redmine",
        icon: "redmine.svg"
    },
    {
        serviceName: "Saleforce",
        icon: "salesforce.svg"
    },
    {
        serviceName: "Sprintly",
        icon: "sprintly.svg"
    },
    {
        serviceName: "Taiga.io",
        icon: "taiga.svg"
    },
    {
        serviceName: "Teamweek",
        icon: "teamweek.svg"
    },
    {
        serviceName: "Teamwork",
        icon: "teamwork.svg"
    },
    {
        serviceName: "TestLink",
        icon: "testlink.svg"
    },
    {
        serviceName: "TestRail",
        icon: "testrail.svg"
    },
    {
        serviceName: "Visual Studio TFS",
        icon: "vstfs.svg"
    },
    {
        serviceName: "Todoist",
        icon: "todoist.svg"
    },
    {
        serviceName: "Trac",
        icon: "trac.svg"
    },
    {
        serviceName: "Trello",
        icon: "trello.svg"
    },
    {
        serviceName: "Usedesk",
        icon: "usedesk.svg"
    },
    {
        serviceName: "UserEcho",
        icon: "userecho.svg"
    },
    {
        serviceName: "UserVoice",
        icon: "uservoice.svg"
    },
    {
        serviceName: "Waffle",
        icon: "waffleio.svg"
    },
    {
        serviceName: "Wrike",
        icon: "wrike.svg"
    },
    {
        serviceName: "Wunderlist",
        icon: "wunderlist.svg"
    },
    {
        serviceName: "YouTrack",
        icon: "youtrack.svg"
    },
    {
        serviceName: "Zapier",
        icon: "zapier.svg"
    },
    {
        serviceName: "Zendesk",
        icon: "zendesk.svg"
    },
    {
        serviceName: "ZenHub",
        icon: "zenhub.svg"
    },
    {
        serviceName: "Zoho CRM",
        icon: "zoho.svg"
    },
    {
        serviceName: "Zenkit",
        icon: "zenkit.svg"
    }
];

function renderIntegrations(holder: string) {
    let content = integrations.map(item => $('<li>')
        .attr('title', item.serviceName)
        .append(`
<label class="logo-wrapper">
  <input type="checkbox" name="${item.serviceName}" />
  <span class="logo-area">
    <img src="../images/integrations/${item.icon}" alt="${item.serviceName}" />
  </span>
</label>`));
    $(holder).empty().append(content);
}

renderIntegrations('#integrations');

// jQuery Page init function
$(document).ready(initPage);

function initPage() {
    setScrollArea();
    setAllLogos();
    showPopup();
    checkSelect();
    $('.js-select').select2({
        minimumResultsForSearch: Infinity
    });
}

$(window).resize(function () {
    setScrollArea();
});

function setScrollArea() {
    let headerHeight = $('.header').outerHeight();
    let filterHeight = $('.filter-section').outerHeight();
    let bodyHeight = $(document).height();
    let containerMargins = 82;
    let scrollAreaHeight = bodyHeight - containerMargins - headerHeight - filterHeight;
    $('.logos-section').css("height", scrollAreaHeight + "px");
}

function showPopup() {
    $('.logo-wrapper').click(function () {
        if ($(this).children('input:checkbox').prop('checked')) {
            $(this).addClass('active');
            $('.location-popup, .overlay').addClass('visible');
        }
    });

    $('.close-popup').click(function () {
        $('.location-popup, .overlay').removeClass('visible');
        $('.logo-wrapper.active').removeClass('active').find('input:checkbox').prop('checked', false);
    });

    $('.show-confirm').click(function () {
        $('.location-popup, .overlay').removeClass('visible');
        $('.logo-wrapper.active').removeClass('active').find('input:checkbox').prop('checked', true);
    });
}

function setAllLogos() {
    $('.enable-all').click(function () {
        $('.logos-list input:checkbox').each(function () {
            $(this).prop('checked', true);
        })
    });

    $('.disable-all').click(function () {
        $('.logos-list input:checkbox').each(function () {
            $(this).prop('checked', false);
        })
    });
}

function checkSelect() {
    $('.js-select').on("select2:selecting", function (e) {
        if ($('.js-select').find(':selected').val() === 'Server') {
            $('.form-group.hidden:visible').hide(500);
        } else {
            $('.form-group.hidden:hidden').show(500);
        }
    });
}