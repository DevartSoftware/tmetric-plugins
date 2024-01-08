// wrapper over chrome.storage.local
const storage = {

    getItem: async (key: string) => {
        const response = await browser.storage.local.get(key);
        return response && response[key] as string || null;
    },

    setItem: async (key: string, value: string) => {
        await browser.storage.local.set({ [key]: value });
    }
};
