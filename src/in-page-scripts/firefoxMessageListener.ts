window.addEventListener(
    'message',
    event => {
        if (event.data == "version") {
            window.postMessage({ version: "1.3.2" }, event.origin);
        }
    },
    false);