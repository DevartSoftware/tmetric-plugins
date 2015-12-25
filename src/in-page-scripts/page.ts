if (typeof document !== 'undefined') {

    /**
     * Retrieves messages from background script.
     */
    function onBackgroundMessage(message: ITabMessage) {

        if (isFinalized) {
            return;
        }

        if (pingTimeouts[message.action]) {
            clearTimeout(pingTimeouts[message.action]);
            pingTimeouts[message.action] = null;
        }

        if (message.action == 'setTimer') {
            Integrations.IntegrationService.setTimer(message.data);
            if (Integrations.IntegrationService.needsUpdate()) {
                parseAfterPings = true;
            }
        }

        if (parseAfterPings) {
            parsePage();
        }

        initialize();
    }

    /**
     * Sends message to background script.
     */
    var sendBackgroundMessage = (() => {

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

        return (message: ITabMessage) => {

            // finalize script when extension removed/disabled/upgraded (#66666)
            var callbackAction = message.action + '_callback';
            if (pingTimeouts[callbackAction]) {
                clearTimeout(pingTimeouts[callbackAction]);
            }

            pingTimeouts[callbackAction] = setTimeout(finalize, 30000);

            try {
                sendBackgroundMessage(message);
            }
            catch (e) {
                finalize();
            }
        };
    })();

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
        for (var ping in pingTimeouts) {
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
     * Parses issues and adds timer links on a page.
     */
    function parsePage() {

        // do not parse page when extension is not responding (disabled/upgraded/uninstalled)
        for (var ping in pingTimeouts) {
            if (pingTimeouts[ping]) {
                parseAfterPings = true;
                return;
            }
        }

        parseAfterPings = false;

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
            if (issues.some(i => !Integrations.IntegrationService.isSameIssue(i, issue))) {

                // If page contains several issues, keep project only
                var projectName = issue.projectName;
                issue = { issueName: '' };

                if (projectName && issues.every(i => i.projectName == projectName)) {
                    issue.projectName = projectName;
                }
            }
        }

        var data = <ITabInfo>{ url, title, issue };

        sendBackgroundMessage({ action: 'setTabInfo', data });

        if (!isFinalized && observeMutations && !mutationObserver) {
            mutationObserver = new MutationObserver(parsePage);
            mutationObserver.observe(document, { childList: true, subtree: true });
        }
    }

    function onIFrameMessage(evt) {
        var message = evt.data;
        if (!message) {
            return;
        }
        if (message.topic == 'mutation.iframe') {
            var iframes = Integrations.IntegrationService.getIssueIFrames();
            var shoudParse = iframes.some((iframe) => {
                return iframe.contentWindow.location.href == message.url;
            });
            if (shoudParse) {
                parsePage();
            }
        }
    }
    window.addEventListener('message', onIFrameMessage, false);

    var oldUrl = '';
    var oldTitle = '';
    var changeCheckerHandle: number;
    var mutationObserver: MutationObserver;
    var pingTimeouts = <{ [callbackAction: string]: number }>{};
    var isInitialized = false;
    var isFinalized = false;
    var parseAfterPings = true;

    Integrations.IntegrationService.clearPage();
    sendBackgroundMessage({ action: 'getTimer' });
}