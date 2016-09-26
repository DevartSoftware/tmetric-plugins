window.addEventListener(
    'message',
    event => {
        if (event.data == "version") {
            window.postMessage({ version: "1.2.1.1" }, event.origin);
        }
    },
    false);