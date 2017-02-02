window.addEventListener(
    'message',
    event => {
        if (event.data == "version") {
            window.postMessage({ version: "1.3.4" }, event.origin);
        }
    },
    false);