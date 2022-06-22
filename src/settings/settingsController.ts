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

function switchMenuItem(element: JQuery, tabBox: string, isScrollNeeded: boolean = false ) {
    if (!$(element).parent('li').hasClass('active')) {
        $('.tab-box.visible').hide().removeClass('visible');
        $('.tabset li.active').removeClass('active');

        $(element).parent('li').addClass('active');
        $(tabBox).addClass('visible').fadeIn(400);

        if (isScrollNeeded) {
            setIntegrationsScrollArea();
        }
    }
}

// Navigation Tabs
function navTabs() {
    $('.tabset a').on('click', function(e){
        const tabBox = $(this).attr('href');
        switchMenuItem(this, tabBox, true);
    });
}

function initActiveTab() {
    const tabBox = document.location.hash;
    if (tabBox) {
        const navItem = $(`.tabset a[href='${tabBox}']`);

        switchMenuItem(navItem, tabBox);
    }
}

$(document).ready(() => {
    initActiveTab();
    initShowPopupSelector();
    setIntegrationsScrollArea();
    navTabs();

    $('.copyright').text(`© ${new Date().getFullYear()} Devart`);

    $(window).resize(function () {
        setIntegrationsScrollArea();
    });
});