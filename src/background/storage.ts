// wrapper over local storage (will be replaced by chrome.storage.local in manifest v3)
const storage = {

    getItem: (key: string) => {
        return new Promise<string>((resolve, reject) => {
            try {
                const value = localStorage.getItem(key);
                resolve(value);
                //chrome.storage.local.get(key, response => {
                //    const error = chrome.runtime.lastError
                //    if (error) {
                //        reject(error);
                //    } else {
                //        resolve((response && response[key]) || null);
                //    }
                //});
            } catch (error) {
                reject(error);
            }
        });
    },

    setItem: (key: string, value: string) => {
        return new Promise<void>((resolve, reject) => {
            try {
                localStorage.setItem(key, value);
                resolve();

                // duplicate in chrome.storage that will be used in manifest v3
                chrome.storage.local.set({ [key]: value }, () => {
                    const error = chrome.runtime.lastError
                    if (error) {
                        console.log(error); //reject(error);
                    }
                    //else {
                    //    resolve();
                    //}
                });
            } catch (error) {
                reject(error);
            }
        });
    }
};
