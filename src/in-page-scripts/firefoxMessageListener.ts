window.addEventListener(
    'message',
    event => {
        if (event.data == "version") {
            window.postMessage({ version: "2.0.0" }, event.origin);
        }
    },
    false);