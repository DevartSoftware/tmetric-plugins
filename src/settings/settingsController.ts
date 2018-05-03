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