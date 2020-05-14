const integrations = <IntegrationInfo[]>[
    {
        serviceName: "Asana",
        icon: "asana.svg"
    }
];
const integrations = <IntegrationInfo[]>[
    {
        serviceName: "Asana",
        icon: "asana.svg"
    }
];

function renderIntegrations(holder: string) {
    let content = integrations.map(item => $('<span>')
        .attr('title', item.serviceName)
        .append(`<img src="../images/integrations/${item.icon}"/>`)
    );
    $(holder).empty().append(content);
}

renderIntegrations('#integrations');

// Page init function
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

$(window).resize(function() {
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
    $('.logo-wrapper').click(function() {
        if ($(this).children('input:checkbox').prop('checked')) {
            $(this).addClass('active');
            $('.location-popup').addClass('visible');
            $('.overlay').addClass('visible');
        }
    });

    $('.close-popup, .overlay').click(function() {
        $('.location-popup').removeClass('visible');
        $('.overlay').removeClass('visible');
        disableActiveLogo();
    });

    $('.show-confirm').click(function() {
        $('.location-popup').removeClass('visible');
        $('.confirm-popup').addClass('visible');
    });

    $('.close-confirm, .overlay').click(function() {
        closeConfirmPopup();
        disableActiveLogo();
    });

    $('.allow-confirm').click(function() {
        closeConfirmPopup();
        $('.logo-wrapper.active').removeClass('active').find('input:checkbox').prop('checked',true);
    });
}

function closeConfirmPopup() {
    $('.confirm-popup').removeClass('visible');
    $('.overlay').removeClass('visible');
}

function disableActiveLogo() {
    $('.logo-wrapper.active').removeClass('active').find('input:checked').prop('checked',false);
}

function setAllLogos() {
    $('.enable-all').click(function() {
        $('.logos-list input:checkbox').each(function(){
            $(this).prop('checked',true);
        })
    });

    $('.disable-all').click(function() {
        $('.logos-list input:checkbox').each(function(){
            $(this).prop('checked',false);
        })
    });
}

function checkSelect() {
    $('.js-select').on("select2:selecting", function(e) {
        if ($('.js-select').find(':selected').val() === 'Server') {
            $('body').removeClass('Server');
            $('.form-group.hidden:visible').hide(500);
        } else {
            $('body').addClass('Server');
            $('.form-group.hidden:hidden').show(500);
        }
    });
}

function renderIntegrations(holder: string) {
    let content = integrations.map(item => $('<span>')
        .attr('title', item.serviceName)
        .append(`<img src="../images/integrations/${item.icon}"/>`)
    );
    $(holder).empty().append(content);
}

renderIntegrations('#integrations');
