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
        let items = this.settings.map(_ => $('<option />').text(_));
        $('.settings-container select.input').append(items);

        let selected = this.sendBackgroundMessage({
            action: 'loadExtensionSettings'
        }, (response) => {
            let selectedOption = response.data && <any>response.data.showPopup;
            $('.settings-container select.input').val(selectedOption || this.settings[<any>Models.ShowPopupOption.Always]);
            console.log($('.settings-container select.input').val())
        });
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
            this.sendBackgroundMessage({
                action: 'saveExtensionSettings',
                data: <IExtensionSettings>{
                    showPopup: $('#show-popup-settings :selected').val()
                }
            });
        })
    }
}