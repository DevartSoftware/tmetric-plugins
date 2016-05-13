window.addEventListener(
    'message',
    event => {
        if (event.data == "version") {
            window.postMessage({ version: "1.1.0" }, event.origin);
        }
    },
    false);