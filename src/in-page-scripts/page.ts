interface Window {
    initPage: () => void;
    parsePage: () => void;
    sendBackgroundMessagee: (message: ITabMessage) => void;
}

if (typeof window != 'undefined' && !window.initPage) {

    let oldUrl = '';
    let oldTitle = '';
    let changeCheckerHandle: number | null;
    let mutationObserver: MutationObserver | null;
    const pingTimeouts = {} as { [callbackAction: string]: number | null };
    let isInitialized = false;
    let isFinalized = false;
    let parseAfterPings = true;

    window.initPage = function () {

        /**
         * Retrieves messages from background script.
         */
        function onBackgroundMessage(message: ITabCallbackMessage) {

            if (isFinalized) {
                return;
            }

            const pingTimeout = pingTimeouts[message.action]
            pingTimeout && clearTimeout(pingTimeout);
            pingTimeouts[message.action] = null;

            // Only for Firefox to inject scripts in right order
            if (message.action == 'initPage') {
                window.sendBackgroundMessagee({ action: 'getConstants' });
                window.sendBackgroundMessagee({ action: 'getTimer' });
                return;
            }

            if (message.action == 'setTimer') {
                IntegrationService.setTimer(message.data);
                if (IntegrationService.needsUpdate()) {
                    parseAfterPings = true;
                }
            } else if (message.action == 'setIssuesDurations') {
                IntegrationService.setIssuesDurations(message.data);
            } else if (message.action == 'setConstants') {
                const constants = message.data as Models.Constants;
                IntegrationService.setConstants(constants);
            }

            if (parseAfterPings) {
                window.parsePage();
            }

            initialize();
        }

        browser.runtime.onMessage.addListener(onBackgroundMessage);

        /**
         * Sends message to background script.
         */
        window.sendBackgroundMessagee = function (message: ITabMessage) {

            // finalize script when extension removed/disabled/upgraded (#66666)
            const callbackAction = message.action + '_callback';
            const pingTimeout = pingTimeouts[callbackAction]
            pingTimeout && clearTimeout(pingTimeout);
            pingTimeouts[callbackAction] = setTimeout(() => finalize(), 30000);
            void browser.sendToBackgroundReliably(message).catch(() => finalize());
        };

        /**
         * Starts periodic checking of url/title changes. Checking stops on focus loss.
         */
        function startCheckChanges() {
            if (changeCheckerHandle == null) {
                changeCheckerHandle = setInterval(() => {
                    if (document.title != oldTitle || document.URL != oldUrl) {
                        window.parsePage();
                    }
                    if (!document.hasFocus()) {
                        changeCheckerHandle && clearInterval(changeCheckerHandle);
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
            for (const ping in pingTimeouts) {
                const pingTimeout = pingTimeouts[ping];
                if (pingTimeout) {
                    clearTimeout(pingTimeout);
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
            for (const ping in pingTimeouts) {
                if (pingTimeouts[ping]) {
                    parseAfterPings = true;
                    return;
                }
            }

            parseAfterPings = false;

            const url = document.URL;
            const title = document.title;

            const checkAllIntegrations = url != oldUrl;

            oldUrl = url;
            oldTitle = title;

            const observeMutations = IntegrationService.updateLinks(checkAllIntegrations);

            if (!isFinalized && observeMutations && !mutationObserver) {
                mutationObserver = new MutationObserver(parsePage);
                mutationObserver.observe(document, { childList: true, subtree: true });
            }
        }

        IntegrationService.onIssueLinksUpdated = () => {
            // clear queue to prevent observer reentering (TE-209)
            if (mutationObserver) {
                mutationObserver.takeRecords();
            }
        }

        window.parsePage = parsePage;

        IntegrationService.clearPage();
        window.sendBackgroundMessagee({ action: 'getConstants' });
        window.sendBackgroundMessagee({ action: 'getTimer' });
    }
}