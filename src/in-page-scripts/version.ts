(function () {

    if (typeof document == undefined) {
        return;
    }

    let head = document.querySelector('head');
    if (!head) {
        return;
    }

    let appMeta = <HTMLMetaElement>head.querySelector('meta[name="application"]');
    if (!appMeta || appMeta.content != 'TMetric') {
        return;
    }

    let extensionInfo = { // object is updated from gulp build
        version: '2.2.2'
    };

    let metaName = 'tmetric-extension-version';

    let oldMeta = head.querySelector(`meta[name="${metaName}"]`);
    if (oldMeta) {
        head.removeChild(oldMeta);
    }

    let meta = document.createElement('meta');
    meta.name = metaName;
    meta.content = extensionInfo.version;
    head.appendChild(meta);
})();