// wrapper over chrome.storage.local
const storage = {

    getItem: (key: string) => {
        return new Promise<string>((resolve, reject) => {
            try {
                chrome.storage.local.get(key, response => {
                    const error = chrome.runtime.lastError
                    if (error) {
                        reject(error);
                    } else {
                        resolve((response && response[key]) || null);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    setItem: (key: string, value: string) => {
        return new Promise<void>((resolve, reject) => {
            try {
                chrome.storage.local.set({ [key]: value }, () => {
                    const error = chrome.runtime.lastError
                    if (error) {
                        console.log(error); //reject(error);
                    } {
                        resolve();
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
};
