window.chrome = <typeof chrome>{

    runtime: {

        onMessage: {

            addListener: (handler) => {
                safari.self.addEventListener('message', (messageEvent: SafariMessage) => {
                    if (messageEvent.name == 'api_bridge') {
                        handler(messageEvent.message, null, null);
                    }
                }, false)
            }
        },

        sendMessage: (message: any) => {
            safari.self.tab.dispatchMessage('api_bridge', message);
        }
    }
}