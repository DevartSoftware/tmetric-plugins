interface ISimpleEvent<T> {
    (handler: (arg: T) => void);
    emit(arg: T);
}

class SimpleEvent {

    static create<T>() {
        let handlers: ((arg: T) => void)[] = [];
        let result = <ISimpleEvent<T>>(handler => {
            handlers.push(handler);
        });
        result.emit = (arg: T) => {
            Promise.resolve().then(() => {
                handlers.forEach(handler => handler(arg));
            });
        }
        return result;
    }
}