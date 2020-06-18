class SettingsController {

    constructor() {

        chrome.storage.sync.get(
            <IExtensionSettings>{ showPopup: Models.ShowPopupOption.Always },
            (settings: IExtensionSettings) => {

                document.body.style.visibility = 'visible'; // Prevent flickering (TE-128)

                const showOptions = {
                    [Models.ShowPopupOption.Always]: 'Always',
                    [Models.ShowPopupOption.WhenProjectIsNotSpecified]: 'When project is not specified',
                    [Models.ShowPopupOption.Never]: 'Never'
                }
                let items = <JQuery[]>[];
                for (let option in showOptions) {
                    items.push($('<option />').text(showOptions[option]).val(option.toString()));
                }

                $('#show-popup-settings')
                    .append(items)
                    .val(settings.showPopup.toString())
                    .on('change', () => {
                        chrome.storage.sync.set(<IExtensionSettings>{
                            showPopup: $('#show-popup-settings :selected').val()
                        });
                    });
            });
    }
}

if (typeof document != undefined) {
    new SettingsController();
}

// Navigation Tabs
function navTabs() {
    $('.tabset a').on('click', function(e){
        e.preventDefault();
        if (!$(this).parent('li').hasClass('active')) {
            $('.tab-box.visible').hide().removeClass('visible');
            $('.tabset li.active').removeClass('active');

            let tabBox = $(this).attr('href');
            $(this).parent('li').addClass('active');
            $(tabBox).addClass('visible').fadeIn(400);
            setSettingsScrollArea();
        }
    });
}

// Settings page scroll area
function setSettingsScrollArea() {
    if ($('.settings-page').length > 0) {
        let mainHeight = $('.settings-main .main-content').outerHeight();
        let filterHeight = $('.filter-section').outerHeight();
        let containerMargins = 22;
        let scrollAreaHeight = mainHeight - containerMargins - filterHeight;
        $('.settings-page .logos-section').css("height", scrollAreaHeight + "px");
    }
}

$(document).ready(() => {

    setSettingsScrollArea();
    $('.js-select').select2({
        minimumResultsForSearch: Infinity
    });
    navTabs();

    $(window).resize(function () {
        setSettingsScrollArea();
    });

});
