if (typeof browser === 'undefined' || !browser.runtime) {
    globalThis.browser = chrome as typeof browser;
}
if (!browser.sendToBackgroundReliably) {
    const con = console;
    browser.sendToBackgroundReliably = async (message, options) => {
        let delay = 100;
        while (true) {
            try {
                return await browser.runtime.sendMessage(message);
            }
            catch (error) {
                if (delay > 1000) {
                    con.error(`${message.action}: ${error}`);
                    if (options?.throwErrors) {
                        throw error;
                    }
                    break;
                }
                // Background page is not loaded yet
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }
}