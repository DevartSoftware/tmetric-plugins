/// <reference path="../typings/firefox/firefox.d.ts" />

// Emulates Firefox port:
// https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Content_Scripts/using_port

class PortShim implements Firefox.Port
{
    private _handlers = <{ [methodName: string]: [Function, boolean][] }>{};

    link: PortShim;

    emit(method: string, ...args: any[]): void
    {
        args.splice(0, 0, method);
        this.link.onemit.apply(this.link, args);
    }

    on(method: string, handler: (...args: any[]) => void, once?: boolean): void
    {
        var handlers = this._handlers[method];
        if (!handlers)
        {
            handlers = this._handlers[method] = [];
        }
        handlers.push([handler, !!once]);
    }

    once(method: string, handler: (...args: any[]) => void): void
    {
        this.on(method, handler, true);
    }

    removeListener(method: string, handler: (...args: any[]) => void): void
    {
        var handlers = this._handlers[method];
        if (handlers)
        {
            for (var i = 0; i < handlers.length; i++)
            {
                if (handlers[i][0] == handler)
                {
                    handlers.splice(i, 1);
                    i--;
                }
            }
        }
    }

    private onemit(method: string, ...args: any[])
    {
        var handlers = this._handlers[method];
        if (handlers)
        {
            for (var i = 0; i < handlers.length; i++)
            {
                var handler = handlers[i][0];
                if (handlers[i][1])
                {
                    handlers.splice(i, 1);
                    i--;
                }
                handler.apply(this.link, args);
            }
        }
    }
}

var backgroundPort = new PortShim(); // Port used in ChromeExtension
var connectionPort = new PortShim(); // Port used in content (page) scripts
backgroundPort.link = connectionPort;
connectionPort.link = backgroundPort;
self.port = connectionPort;