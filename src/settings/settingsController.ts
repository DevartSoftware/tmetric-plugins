function initShowPopupSelector() {
    chrome.storage.sync.get(
        <IExtensionSettings>{showPopup: Models.ShowPopupOption.Always},
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
                })
                .select2({
                    minimumResultsForSearch: Infinity
                })
                .trigger('change');
        }
    )
}

// Set Integrations list scroll area
function setIntegrationsScrollArea() {
    if ($('.settings-page').length > 0) {
        const mainHeight = $('.settings-main .main-content').outerHeight();
        const filterHeight = $('.filter-section').outerHeight();
        const containerMargins = 22;
        const scrollAreaHeight = mainHeight - containerMargins - filterHeight;
        $('.settings-page .logos-section').css("height", scrollAreaHeight + "px");
    }
}

// Navigation Tabs
function navTabs() {
    $('.tabset a').on('click', function(e){
        e.preventDefault();
        if (!$(this).parent('li').hasClass('active')) {
            $('.tab-box.visible').hide().removeClass('visible');
            $('.tabset li.active').removeClass('active');

            const tabBox = $(this).attr('href');
            $(this).parent('li').addClass('active');
            $(tabBox).addClass('visible').fadeIn(400);
            setIntegrationsScrollArea();
        }
    });
}

$(document).ready(() => {
    initShowPopupSelector();
    setIntegrationsScrollArea();
    navTabs();

    $(window).resize(function () {
        setIntegrationsScrollArea();
    });
});
