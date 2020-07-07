(function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
        chrome.storage.local.set({ authorization_code: urlParams.get('code')});
    }
    window.close();
})();
