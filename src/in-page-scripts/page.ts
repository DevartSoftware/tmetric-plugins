if (typeof document !== 'undefined') {

    /**
     * Retrieves messages from background script.
     */
    function onBackgroundMessage(message: ITabMessage) {
        if (message.action == 'setTimer') {

            if (pingTimeout) {
                clearTimeout(pingTimeout);
                pingTimeout = null;
            }

            Integrations.IntegrationService.setTimer(message.data);

            if (needsUpdate || Integrations.IntegrationService.needsUpdate()) {
                needsUpdate = false;
                parsePage();
            }

            this.initialize();
        }
    }

    /**
     * Reparses page after a timer getting. Finalizes script if timer getting fails.
     */
    function getTimer() {
        // finalize script when extension removed/disabled/upgraded (#66666)
        pingTimeout = setTimeout(() => {
            pingTimeout = null;
            finalize();
        }, 30000);
        try {
            needsUpdate = true;
            sendBackgroundMessage({ action: 'getTimer' });
        }
        catch (e) {
            finalize();
        }
    }

    /**
     * Starts periodic checking of url/title changes. Checking stops on focus loss.
     */
    function startCheckChanges() {
        if (changeCheckerHandle == null) {
            changeCheckerHandle = setInterval(() => {
                if (document.title != oldTitle || document.URL != oldUrl) {
                    getTimer();
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
        if (!isInitialized) {
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
        if (pingTimeout) {
            clearTimeout(pingTimeout);
            pingTimeout = null;
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
     * Parses issues and adds timer links on a page.
     */
    function parsePage() {

        var url = document.URL;
        var title = document.title;

        var checkAllIntegrations = url != oldUrl;

        oldUrl = url;
        oldTitle = title;

        var { issues, observeMutations } = Integrations.IntegrationService.updateLinks(checkAllIntegrations);

        if (mutationObserver) {
            // clear queue to prevent observer reentering
            mutationObserver.takeRecords();
        }

        var issue: Integrations.WebToolIssue = null;
        if (issues) {
            issue = issues[0];
            if (issues.length > 1) {
                // If page contains several issues, keep project only
                var projectName = issue.projectName;
                issue = { issueName: '' };

                if (projectName && issues.every(i => i.projectName == projectName)) {
                    issue.projectName = issue.projectName;
                }
            }
        }

        var message = <ITabMessage>{ action: 'setTabInfo', data: <ITabInfo>{ url, title, issue } };

        try {
            sendBackgroundMessage(message);
        }
        catch (e) {
            finalize();
        }

        if (observeMutations && !mutationObserver) {
            mutationObserver = new MutationObserver(() => getTimer());
            mutationObserver.observe(document, { childList: true, subtree: true });
        }
    }

    /**
     * Sends message to background script.
     */
    var sendBackgroundMessage: (message: ITabMessage) => void = self.chrome && self.chrome.runtime && self.chrome.runtime.sendMessage;

    if (sendBackgroundMessage) {
        // chrome
        chrome.runtime.onMessage.addListener(onBackgroundMessage);
    }
    else {
        // firefox
        sendBackgroundMessage = self.postMessage;
        self.on('message', onBackgroundMessage);
    }

    var oldUrl = '';
    var oldTitle = '';
    var changeCheckerHandle: number;
    var mutationObserver: MutationObserver;
    var pingTimeout: number;
    var isInitialized = false;
    var needsUpdate = true;

    Integrations.IntegrationService.clearPage();
    getTimer();
}