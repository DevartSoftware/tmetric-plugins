class SignalRHubProxy {

    _handlers: { [methodName: string]: ((...args: any[]) => void)[] } = {};

    _connection: signalR.HubConnection;

    on(methodName: string, newMethod: (...args: any[]) => void) {
        let handlers = this._handlers[methodName];
        if (!handlers) {
            handlers = this._handlers[methodName] = [];
            if (this.isConnected) {
                this.subscribe(methodName);
            }
        }
        handlers.push(newMethod);
    }

    off(methodName: string, method: (...args: any[]) => void) {
        let h = this._handlers[methodName] || [];
        let i = h.lastIndexOf(method);
        if (i >= 0) {
            h.splice(i, 1);
        }
    }

    onConnect(connection: signalR.HubConnection) {
        this._connection = connection;
        for (let methodName in this._handlers) {
            this.subscribe(methodName);
        }
    }

    onDisconnect(connection: signalR.HubConnection) {
        if (connection == this._connection) {
            this._connection = undefined;
        }
    }

    get isConnected() {
        return !!this._connection;
    }

    private subscribe(methodName: string) {
        this._connection.on(methodName, (...args) => {
            let handlers = this._handlers[methodName];
            if (handlers) {
                handlers.forEach(_ => _(...args));
            }
        });
    }
}