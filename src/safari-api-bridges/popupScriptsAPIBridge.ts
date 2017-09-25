window.chrome = <typeof chrome>{
    runtime: {
        sendMessage(message: any, responseCallback?: (response: any) => void) {
            message = JSON.parse(JSON.stringify(message || null));
            let callback = responseCallback;
            if (callback) {
                callback = response => {
                    response = JSON.parse(JSON.stringify(response || null));
                    responseCallback(response);
                };
            }
            safari.extension.globalPage.contentWindow.safariBridge.onMessage(
                message,
                { url: null, tab: null },
                response => {
                    Promise.resolve().then(() => {
                        responseCallback && responseCallback(response);
                    });
                });
        }
    }
}