if (window.top != window) {

    if (window && window.postMessage) {
        var observer = new MutationObserver(function () {
            window.parent.postMessage({ url: window.location.href, topic: 'mutation.iframe' }, window.location.origin);
        });

        observer.observe(document, { childList: true, subtree: true });
    }
}