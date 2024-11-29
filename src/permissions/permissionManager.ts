class PermissionManager {

    private static isOptionalOrigin(origin: string) {
        return !/^.*:\/\/.*\.tmetric\.com(?:\:\d+)?\/.*/i.test(origin);
    }

    private async pushChangesToStorage(key: string, origins: string[]) {
        if (origins?.length) {
            // see ContentScriptsRegistrator (TMET-10408)
            await browser.storage.session.set({ [key]: origins });
        }
    }

    private async request(origins: string[]) {
        let isSuccessful = true;
        if (!origins?.length) {
            return isSuccessful;
        }
        const requestedOrigins = origins.filter(PermissionManager.isOptionalOrigin);
        if (requestedOrigins.length) {
            // it should be the first await after the user clicks (TMET-10822)
            isSuccessful = await browser.permissions.request({ origins: requestedOrigins });
        }
        if (isSuccessful) {
            await this.pushChangesToStorage('originsAdded', origins);
        }
        return isSuccessful;
    }

    private async remove(origins: string[]) {
        if (!origins?.length) {
            return;
        }
        const requestedOrigins = origins.filter(PermissionManager.isOptionalOrigin);
        let isSuccessful = true;
        if (requestedOrigins.length) {
            isSuccessful = await browser.permissions.remove({ origins: requestedOrigins });
        }
        if (isSuccessful) {
            await this.pushChangesToStorage('originsRemoved', origins);
        }
    }

    requestPermissions(serviceTypes: ServiceTypesMap) {
        const { originsAdded } = WebToolManager.addServiceTypes(serviceTypes);
        return this.request(Object.keys(originsAdded));
    }

    removePermissions(serviceTypes: ServiceTypesMap) {
        const { originsRemoved } = WebToolManager.removeServiceTypes(serviceTypes);
        return this.remove(Object.keys(originsRemoved));
    }

    updatePermissions(serviceTypesAdded: ServiceTypesMap, serviceTypesRemoved: ServiceTypesMap) {
        const { originsAdded, originsRemoved } =
            WebToolManager.updateServiceTypes(serviceTypesAdded, serviceTypesRemoved);
        return Promise.all([
            this.request(Object.keys(originsAdded)),
            this.remove(Object.keys(originsRemoved)),
        ]);
    }

    async cleanupPermissions() {
        const allPermissions = await browser.permissions.getAll();
        const origins = (allPermissions.origins || []).filter(PermissionManager.isOptionalOrigin);
        await this.remove(origins);
    }
}
