try {
    importScripts(
        "lib/signalr.min.js",
        "unified-ext.js",
        "background/storage.js",
        "background/ajaxClient.js",
        "background/oidcClient.js",
        "background/webToolDescriptions.js",
        "background/webToolManager.js",
        "background/contentScriptsRegistrator.js",
        "background/simpleEvent.js",
        "background/serverConnection.js",
        "background/signalRHubProxy.js",
        "background/signalRConnection.js",
        "background/backgroundBase.js",
        "background/extensionBase.js",
        "background/chromeExtension.js"
    );
} catch (error) {
    console.log(error);
}