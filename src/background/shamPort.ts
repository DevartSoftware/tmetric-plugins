// Emulates Firefox port:
// https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Content_Scripts/using_port

class ShamPort implements Firefox.Port {

    private _handlers = <{ [methodName: string]: [Function, boolean][] }>{};

    private _link: ShamPort;

    constructor(link?: ShamPort) {
        if (link) {
            this._link = link;
            this._link._link = this;
        }
    }

    emit(method: string, ...args: any[]): void {
        var link = this._link;
        Promise.resolve().then(() => {
            link.onemit.call(link, method, args);
        });
    }

    on(method: string, handler: (...args: any[]) => void, once?: boolean): void {
        var handlers = this._handlers[method];
        if (!handlers) {
            handlers = this._handlers[method] = [];
        }
        handlers.push([handler, !!once]);
    }

    once(method: string, handler: (...args: any[]) => void): void {
        this.on(method, handler, true);
    }

    removeListener(method: string, handler: (...args: any[]) => void): void {
        var handlers = this._handlers[method];
        if (handlers) {
            for (var i = 0; i < handlers.length; i++) {
                if (handlers[i][0] == handler) {
                    handlers.splice(i, 1);
                    i--;
                }
            }
        }
    }

    private onemit(method: string, args: any[]) {
        var handlers = this._handlers[method];
        if (handlers) {
            for (var i = 0; i < handlers.length; i++) {
                var handler = handlers[i][0];
                if (handlers[i][1]) {
                    handlers.splice(i, 1);
                    i--;
                }
                handler.apply(this._link, args);
            }
        }
    }
}

var backgroundPort = new ShamPort(); // Port used in ChromeExtension
var connectionPort = new ShamPort(backgroundPort); // Port used in content (page) scripts
self.port = connectionPort;