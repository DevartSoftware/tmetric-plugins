if (typeof document != undefined) {

    (function () {
        let meta = document.createElement('meta');
        meta.name = 'tmetric-extension-version';
        meta.content = { version: '2.3.4' }.version; // { } is used to replace number of version when extension build.
        document.querySelector('head').appendChild(meta);
    })();
}