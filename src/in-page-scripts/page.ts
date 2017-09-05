if (typeof document !== 'undefined') {

    let constants: Models.Constants;

    /**
     * Retrieves messages from background script.
     */
    function onBackgroundMessage(message: ITabMessage) {
        if (isFinalized) {
            return;
        }

        // Only for FireFox to inject scripts in right order
        if (message.action == 'initPage') {
            sendBackgroundMessage({ action: 'getConstants' });
            sendBackgroundMessage({ action: 'getTimer' });
            return;
        }

        if (pingTimeouts[message.action]) {
            clearTimeout(pingTimeouts[message.action]);
            pingTimeouts[message.action] = null;
        }

        // Only for FireFox
        if (message.action == 'error') {
            let a = alert; // prevent strip in release;
            a(constants.extensionName + '\n\n' + message.data.message);
        }

        if (message.action == 'setTimer') {
            Integrations.IntegrationService.setTimer(message.data);
            if (Integrations.IntegrationService.needsUpdate()) {
                parseAfterPings = true;
            }
        } else if (message.action == 'setIssuesDurations') {
            Integrations.IntegrationService.setIssuesDurations(message.data);
        } else if (message.action == 'setConstants') {
            constants = message.data;
            Integrations.IntegrationService.setConstants(constants);
        } else if (message.action == 'showPopup') {
            Integrations.IntegrationService.showPopup(message.data);
        } else if (message.action == 'hidePopup') {
            Integrations.IntegrationService.hidePopup();
        }

        if (parseAfterPings) {
            parsePage();
        }

        initialize();
    }

    chrome.runtime.onMessage.addListener(onBackgroundMessage);

    /**
     * Sends message to background script.
     */
    function sendBackgroundMessage(message: ITabMessage) {

        // finalize script when extension removed/disabled/upgraded (#66666)
        let callbackAction = message.action + '_callback';
        if (pingTimeouts[callbackAction]) {
            clearTimeout(pingTimeouts[callbackAction]);
        }

        pingTimeouts[callbackAction] = setTimeout(() => finalize(), 30000);

        try {
            chrome.runtime.sendMessage(message);
        }
        catch (e) {
            finalize();
        }
    };

    /**
     * Starts periodic checking of url/title changes. Checking stops on focus loss.
     */
    function startCheckChanges() {
        if (changeCheckerHandle == null) {
            changeCheckerHandle = setInterval(() => {
                if (document.title != oldTitle || document.URL != oldUrl) {
                    parsePage();
                }
                if (!document.hasFocus()) {
                    clearInterval(changeCheckerHandle);
                    changeCheckerHandle = null;
                }
            }, 100);
        }
    }

    /**
     * Initializes script.
     */
    function initialize() {
        if (!isInitialized && !isFinalized) {
            isInitialized = true;
            window.addEventListener('focus', startCheckChanges);
            if (document.hasFocus()) {
                startCheckChanges();
            }
        }
    }

    /**
     * Finalizes script
     */
    function finalize() {
        isFinalized = true;
        for (let ping in pingTimeouts) {
            if (pingTimeouts[ping]) {
                clearTimeout(pingTimeouts[ping]);
                pingTimeouts[ping] = null;
            }
        }
        if (mutationObserver) {
            mutationObserver.disconnect();
            mutationObserver = null;
        }
        window.removeEventListener('focus', startCheckChanges);
        if (changeCheckerHandle != null) {
            clearInterval(changeCheckerHandle);
            changeCheckerHandle = null;
        }
    }

    /**
     * Parses issues, adds timer links on a page
     */
    function parsePage() {

        // do not parse page when extension is not responding (disabled/upgraded/uninstalled)
        for (let ping in pingTimeouts) {
            if (pingTimeouts[ping]) {
                parseAfterPings = true;
                return;
            }
        }

        parseAfterPings = false;

        let url = document.URL;
        let title = document.title;

        let checkAllIntegrations = url != oldUrl;

        oldUrl = url;
        oldTitle = title;

        let { issues, observeMutations } = Integrations.IntegrationService.updateLinks(checkAllIntegrations);

        if (mutationObserver) {
            // clear queue to prevent observer reentering
            mutationObserver.takeRecords();
        }

        if (!isFinalized && observeMutations && !mutationObserver) {
            mutationObserver = new MutationObserver(parsePage);
            mutationObserver.observe(document, { childList: true, subtree: true });
        }
    }

    let oldUrl = '';
    let oldTitle = '';
    let changeCheckerHandle: number;
    let mutationObserver: MutationObserver;
    let pingTimeouts = <{ [callbackAction: string]: number }>{};
    let isInitialized = false;
    let isFinalized = false;
    let parseAfterPings = true;

    Integrations.IntegrationService.clearPage();
    sendBackgroundMessage({ action: 'getConstants' });
    sendBackgroundMessage({ action: 'getTimer' });
}