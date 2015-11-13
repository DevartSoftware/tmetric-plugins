var hotkeys = require("sdk/hotkeys");

hotkeys.Hotkey({
    combo: "accel-shift-space",
    onPress: function () {
        extension.actionButton.click();
    }
});
