if (typeof browser === 'undefined' || !browser.runtime) {
    globalThis.browser = chrome;
}