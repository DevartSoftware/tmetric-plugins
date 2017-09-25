window.chrome = <typeof chrome>{

    runtime: {

        onMessage: {

            addListener: (handler) => {
                // TODO: support message only
            }
        },

        sendMessage: (message: any) => {
            // TODO:
        }
    }
}