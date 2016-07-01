window.addEventListener('message', onMessage, false);

function onMessage(event: IWindowMessage) {
    if (event.data == "version") {
        window.postMessage("1.1.1", event.origin);
    }
}