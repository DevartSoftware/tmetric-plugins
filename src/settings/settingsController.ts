class SettingsController {

    constructor() {
        this.initSettings();
    }

    settings = [
        'Always',
        'When project is not specified',
        'Never'
    ]

    fillSettingsDropdown() {
        let items = this.settings.map((item, key) => $('<option />').text(item).val(key.toString()));
        $('.settings-container select.input').append(items);

        chrome.storage.sync.get(null, (settings: IExtensionSettings) => {
            let selectedOption = <any>settings.showPopup;
            $('.settings-container select.input').val(selectedOption || Models.ShowPopupOption.Always);
        })
    }

    initSettings() {
        this.sendBackgroundMessage = (message: ITabMessage, callback?: (response: any) => void) => {
            chrome.runtime.sendMessage(message, response => callback && callback(response));
        }

        this.fillSettingsDropdown();
        this.initControls();
    }

    private sendBackgroundMessage: (message: ITabMessage, callback?: (response: any) => void) => void;

    initControls() {
        $('#show-popup-settings').on('change', () => {
            chrome.storage.sync.set(<IExtensionSettings>{
                showPopup: $('#show-popup-settings :selected').val()
            });
        })
    }
}

if (typeof document != undefined) {

    document.body.style.visibility = 'visible'; // Prevent flickering (TE-128)

    new SettingsController()
}