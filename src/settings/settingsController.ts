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
    }

    initSettings() {
        this.fillSettingsDropdown();
    }
}