window.chrome = <typeof chrome>{

    runtime: {

        onMessage: {

            addListener: (handler) => {
                safari.self.addEventListener('message', (messageEvent: SafariMessage) => {
                    handler(messageEvent.message, null, null);
                }, false)
            }
        },

        sendMessage: (message: any) => {
            safari.self.tab.dispatchMessage('message', message);
        }
    }
}