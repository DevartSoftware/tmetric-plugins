window.addEventListener('message', onMessage, false);

function onMessage(event: IWindowMessage) {
    if (event.data == "version") {
        window.postMessage("0.1.0", event.origin);
    }
}