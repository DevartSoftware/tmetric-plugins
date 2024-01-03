type FileOrCode = { file?: string; code?: string };

type RegisteredContentScriptOptions = browser.contentScripts.RegisteredContentScriptOptions;

type RegistrationCallback = Function;

type RegisteredContentScript = browser.contentScripts.RegisteredContentScript;

declare namespace chrome.contentScripts {
    const register: (contentScriptOptions: RegisteredContentScriptOptions, callback?: RegistrationCallback) => Promise<RegisteredContentScript>;
}

if (typeof chrome === 'object' && !chrome.contentScripts) {

    const contentScriptOptionsStore: { matches: RegExp; options: RegisteredContentScriptOptions }[] = [];

    const getContentScriptOptions = function (url: string) {
        return contentScriptOptionsStore
            .filter(i => i.matches.test(url))
            .map(i => i.options);
    }

    const getRawRegex = function (matchPattern) {
        return '^' + matchPattern
            .replace(/[\-\/\\\^\$\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
            .replace(/\*/g, '.*');
    }

    const patternToRegex = function (...matchPatterns: string[]) {
        return new RegExp(matchPatterns.map(getRawRegex).join('|'), 'i');
    }

    const isOriginPermitted = async function (url) {
        return new Promise((resolve, reject) => {
            chrome.permissions.contains({ origins: [new URL(url).origin + '/*'] }, resolve);
        });
    }

    const getInjectedScriptsFunction = function () {
        const scripts = document['tmetricContentScripts'] || {};
        return scripts;
    }

    const setInjectedScriptFunction = function (file: string) {
        const scripts = document['tmetricContentScripts'] || {};
        scripts[file] = true;
        document['tmetricContentScripts'] = scripts;
    }

    const getInjectedScripts = async function (tabId: number, frameId: number) {
        const result = await chrome.scripting.executeScript({
            target: { tabId, frameIds: [frameId] },
            func: getInjectedScriptsFunction
        });
        return result[0].result as { [name: string]: boolean };
    }

    const setInjectedScript = async function (tabId, frameId, file) {
        await chrome.scripting.executeScript({
            target: { tabId, frameIds: [frameId] },
            func: setInjectedScriptFunction,
            args: [file]
        });
    }

    const injectCss = async function (tabId, frameId, file) {
        await chrome.scripting.insertCSS({
            target: { tabId, frameIds: [frameId] },
            files: [file],
        });
        await setInjectedScript(tabId, frameId, file);
    }

    const injectJs = async function (tabId, frameId, file) {
        await chrome.scripting.executeScript({
            target: { tabId, frameIds: [frameId] },
            files: [file],
        });
        await setInjectedScript(tabId, frameId, file);
    }

    const injectContentScripts = async function (tabId: number, frameId: number, options: browser.contentScripts.RegisteredContentScriptOptions[], injectedScripts: {}) {

        console.log(injectContentScripts.name, { tabId, frameId, options, injectedScripts });

        const isFrame = frameId > 0;

        await Promise.all(options.map(options => {

            if (isFrame && !options.allFrames) {
                return;
            }

            return Promise.all([
                ...(options.css || []).map(({ file }: FileOrCode) => !injectedScripts[file!] && injectCss(tabId, frameId, file)),
                ...(options.js || []).map(({ file }: FileOrCode) => !injectedScripts[file!] && injectJs(tabId, frameId, file))
            ]);
        }));
    }

    const checkInProgress: { [tabFrameKey: string]: boolean } = {};

    const checkFrame = async function (tabId: number, frameId: number, url: string) {

        console.log(checkFrame.name, { tabId, frameId, url })

        if (checkInProgress[`${tabId}-${frameId}`]) {
            console.log('check in progress');
            return;
        }

        checkInProgress[`${tabId}-${frameId}`] = true;

        const options = getContentScriptOptions(url);
        if (options.length) {
            if (await isOriginPermitted(url)) {
                const scripts = await getInjectedScripts(tabId, frameId);
                await injectContentScripts(tabId, frameId, options, scripts);
            }
        }

        delete checkInProgress[`${tabId}-${frameId}`];
    }

    const onNavigation = function (details: chrome.webNavigation.WebNavigationFramedCallbackDetails) {
        const { tabId, frameId, url } = details;
        checkFrame(tabId, frameId, url);
    }

    const addWebNavigationListeners = function () {
        chrome.webNavigation.onCompleted.addListener(onNavigation);
    }

    const addMessageListener = function () {
        chrome.runtime.onMessage.addListener((message: ITabMessage, sender, senderResponse) => {

            //console.log(message, sender)
            const senderTabId = sender.tab?.id;
            if (senderTabId == null) {
                return;
            }

            if (message.action == 'checkContentScripts') {
                checkFrame(senderTabId, sender.frameId!, sender.url!);
                senderResponse(null);
            }
        });
    }

    addWebNavigationListeners();
    addMessageListener();

    chrome.contentScripts = {

        async register(contentScriptOptions, callback) {

            const { matches } = contentScriptOptions;
            const matchesRegex = patternToRegex(...matches);
            const item = { matches: matchesRegex, options: contentScriptOptions };

            contentScriptOptionsStore.push(item);

            const registeredContentScript = {
                async unregister() {
                    const index = contentScriptOptionsStore.indexOf(item);
                    if (index > -1) {
                        contentScriptOptionsStore.splice(index, 1);
                    }
                }
            };

            if (typeof callback === 'function') {
                callback(registeredContentScript);
            }

            return Promise.resolve(registeredContentScript);
        }
    };
}
