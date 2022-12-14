class SignalRHubProxy {

    private _handlers: { [methodName: string]: ((...args: any[]) => void)[] } = {};

    private _connection: signalR.HubConnection;

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
        for (const methodName in this._handlers) {
            this.subscribe(methodName);
        }
    }

    onDisconnect(connection: signalR.HubConnection) {
        if (connection == this._connection) {
            for (const methodName in this._handlers) {
                this.unsubscribe(methodName);
            }
            this._connection = undefined;
        }
    }

    get isConnected() {
        return !!this._connection;
    }

    private _subscriptions: { [methodName: string]: (...args) => void } = {};

    private subscribe(methodName: string) {
        const subscription = (...args) => {
            let handlers = this._handlers[methodName];
            if (handlers) {
                handlers.forEach(_ => _(...args));
            }
        };
        this._subscriptions[methodName] = subscription;
        this._connection.on(methodName, subscription);
    }

    private unsubscribe(methodName: string) {
        const subscription = this._subscriptions[methodName];
        delete this._subscriptions[methodName];
        this._connection.off(methodName, subscription);
    }
}