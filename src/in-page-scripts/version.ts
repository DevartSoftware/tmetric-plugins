(function () {

    if (typeof document == undefined) {
        return;
    }

    let extensionInfo = { // object is updated from gulp build
        version: '2.2.0'
    };

    let metaName = 'tmetric-extension-version';
    let head = document.querySelector('head');
    let oldMeta = head.querySelector(`meta[name="${metaName}"]`);
    if (oldMeta) {
        head.removeChild(oldMeta);
    }

    let meta = document.createElement('meta');
    meta.name = metaName;
    meta.content = extensionInfo.version;
    head.appendChild(meta);
})();