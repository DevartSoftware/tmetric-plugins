class SettingsController {
    constructor() {
        this.settings = [
            'Always',
            'When project is not specified',
            'Never'
        ];
        this.initSettings();
    }
    fillSettingsDropdown() {
        let items = this.settings.map(_ => $('<option />').text(_));
        $('.settings-container select.input').append(items);
    }
    initSettings() {
        this.fillSettingsDropdown();
    }
}
//# sourceMappingURL=settingsController.js.map