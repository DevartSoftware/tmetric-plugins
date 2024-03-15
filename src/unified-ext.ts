(function (g: typeof globalThis) {
    if (!g.browser?.runtime?.sendMessage) {
        g.browser = chrome as typeof browser;
    }
    const b = g.browser;
    const c = console;
    const r = b.runtime;
    const f = r.sendMessage.bind(r);
    b.sendToBackgroundReliably ||= async (message, options) => {
        let delay = 100;
        while (delay) {
            try {
                return await f(message);
            }
            catch (error) {
                if (delay > 1000) {
                    c.error(`${message.action}: ${error}`);
                    if (options?.throwErrors) {
                        throw error;
                    }
                    break;
                }
                // background page is not loaded yet
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }
})(this)
