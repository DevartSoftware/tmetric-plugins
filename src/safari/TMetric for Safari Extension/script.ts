// Utils

function objToParams(obj: any) {
    let params = new URLSearchParams();
    for (let name in obj) {
        let value = obj[name];
        if (Array.isArray(value)) {
            for (let item of value) {
                params.append(name, item);
            }
        } else {
            params.set(name, value)
        }
    }
    return params.toString();
}

function normalizeUrlLastSlash(url: string) {
    if (url[url.length - 1] != '/') {
        url += '/';
    }
    return url;
}

// Settings

var settings = {
    serviceUrl: normalizeUrlLastSlash('https://app.tmetric.com')
};

// Message handling

type ExtensionMessageEventCallback = chrome.runtime.ExtensionMessageEvent extends chrome.events.Event<infer T> ? T : never;

class Messenger implements Partial<chrome.runtime.ExtensionMessageEvent> {

    private _listeners: ExtensionMessageEventCallback[] = [];

    addListener(callback: ExtensionMessageEventCallback) {
        this._listeners.push(callback);
    }

    notifyListeners(message: ITabMessage) {
        this._listeners.forEach(listener => {
            setTimeout(() => listener(message, null, null));
        });
    }
}

var messenger = new Messenger();

window.chrome = <typeof chrome>{
    runtime: {
        sendMessage: (message: ITabMessage, responseCallback: (response: any) => void) => {

            // Emulate extension background message handling
            // Use responseCallback to respond with runtime error

            // Respond callback message
            messenger.notifyListeners({ action: message.action + '_callback' });

            switch (message.action) {

                case 'getConstants':
                    messenger.notifyListeners({ action: 'setConstants', data: {} });
                    break;

                case 'getTimer':
                    messenger.notifyListeners({ action: 'setTimer', data: null });
                    break;

                case 'putTimer':
                    openPopupTimer(message.data);
                    break;

                case 'getIssuesDurations':
                    messenger.notifyListeners({ action: 'setIssuesDurations', data: [] });
                    break;
            }
        },
        onMessage: {
            addListener: messenger.addListener.bind(messenger)
        }
    }
};

// Open popup timer

function openPopupTimer(timer: WebToolIssueTimer) {

    let url = settings.serviceUrl + 'PopupTimer';
    url += '#' + objToParams(timer);

    let popupId = 'TMetricPopup';

    let width = 460 + 2 * 30; // container width plus margins
    let height = 640;

    // get position relative to window center
    let left = Math.round(screenLeft + (outerWidth - width) / 2);
    let top = Math.round(screenTop + (outerHeight - height) / 2);

    let options = `toolbar=no,scrollbars=no,resizable=no,width=${width},height=${height},left=${left},top=${top}`;

    let popup = open(url, popupId, options);

    // check if popup just opened
    if (popup.document.readyState != 'complete') {

        // adjust position using actual dimension
        let xDelta = (width - popup.outerWidth) / 2;
        let yDelta = (height - popup.outerHeight) / 2;
        popup.moveBy(xDelta, yDelta);
    }

    popup.focus();
}

// Bundle inclusion

declare type ContentScriptsManifest = chrome.runtime.Manifest['content_scripts'];

function isLocationMatchPattern(pattern: string) {

    let patternMatch = pattern.match(/(.+):\/\/(.+)(\/.+)/);
    let patternScheme = patternMatch[1];
    let patternHost = patternMatch[2];
    let patternPath = patternMatch[3];

    return (new RegExp((patternScheme == '*' ? 'http|htpps' : patternScheme) + ':', 'i')).test(location.protocol) &&
        (new RegExp(patternHost.replace('.', '\.').replace('*', '.*'), 'i')).test(location.host) &&
        (new RegExp(patternPath, 'i')).test(location.pathname);
}

function shouldIncludeScripts(item: ContentScriptsManifest[number]) {
    let isMatch = item.matches && item.matches.some(match => isLocationMatchPattern(match));
    let isTopWindow = window.top == window;
    return isMatch && (isTopWindow || item.all_frames);
}