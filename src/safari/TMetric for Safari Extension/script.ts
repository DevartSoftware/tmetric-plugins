// Settings

function normalizeUrlLastSlash(url: string) {
    if (url[url.length - 1] != '/') {
        url += '/';
    }
    return url;
}

var settings = {
    serviceUrl: normalizeUrlLastSlash('https://app.tmetric.com')
};

// Bundle inclusion functions

function isLocationMatchPattern (pattern: string) {

    let patternMatch = pattern.match(/(.+):\/\/(.+)(\/.+)/);
    let patternScheme = patternMatch[1];
    let patternHost = patternMatch[2];
    let patternPath = patternMatch[3];

    return (new RegExp((patternScheme == '*' ? 'http|htpps' : patternScheme) + ':', 'i')).test(location.protocol) &&
        (new RegExp(patternHost.replace('.', '\.').replace('*', '.*'), 'i')).test(location.host) &&
        (new RegExp(patternPath, 'i')).test(location.pathname);
}

function shouldIncludeScripts(item: chrome.runtime.Manifest['content_scripts'][number]) {

    let isMatch = item.matches && item.matches.some(match => isLocationMatchPattern(match));
    let isExcludeMatch = item.exclude_matches && item.exclude_matches.some(match => isLocationMatchPattern(match));
    
    if (!isMatch || isExcludeMatch) {
        return false;
    }

    let isTopWindow = window.top == window;
    return isTopWindow || item.all_frames;

}

// Message handling

type ExtensionMessageEventCallback = chrome.runtime.ExtensionMessageEvent extends chrome.events.Event<infer T> ? T : never;

class Messenger implements chrome.runtime.ExtensionMessageEvent {

    private _listeners: ExtensionMessageEventCallback[] = [];

    addListener (callback: ExtensionMessageEventCallback) {
        this._listeners.push(callback);
    }

    removeListener (callback: ExtensionMessageEventCallback) {
        let index = this._listeners.indexOf(callback);
        if (index < 0) {
            return;
        }

        this._listeners.splice(index, 1);
    }

    hasListener (callback: ExtensionMessageEventCallback) {
        return this._listeners.indexOf(callback) > -1;
    }

    hasListeners () {
        return this._listeners.length > 0;
    }

    getRules() {}

    addRules() {}

    removeRules() {}

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
                    messenger.notifyListeners({ action: 'setConstants', data: {}});
                    break;

                case 'getTimer':
                    messenger.notifyListeners({ action: 'setTimer', data: null});
                    break;

                case 'putTimer':
                    openPopupTimer(message.data);
                    break;

                case 'getIssuesDurations':
                    messenger.notifyListeners({ action: 'setIssuesDurations', data: []});
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
    window.open(url, 'TMetricPopup', 'toolbar=no,scrollbars=no,resizable=no,width=480,height=640,left=0,top=0');
}

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
