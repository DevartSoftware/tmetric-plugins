class PermissionManager {

    private async handleRequiredOrigins(key: string, origins: string[]) {
        if (!origins?.length) {
            return [];
        }
        const requiredOrigins = [] as string[];
        const isRequired = /^.*:\/\/.*\.tmetric\.com(?:\:\d+)?\/.*/i;
        origins = origins.filter(origin => {
            if (!isRequired.test(origin)) {
                return true;
            }
            requiredOrigins.push(origin);
        });
        if (requiredOrigins.length) {
            // see ContentScriptsRegistrator (TMET-10408)
            await browser.storage.session.set({ [key]: requiredOrigins });
        }
        return origins;
    }

    private async request(origins: string[]) {
        origins = await this.handleRequiredOrigins('requiredOriginsAdded', origins);
        if (!origins.length) {
            return true;
        }
        return await browser.permissions.request({ origins });
    }

    private async remove(origins: string[]) {
        origins = await this.handleRequiredOrigins('requiredOriginsRemoved', origins);
        if (!origins.length) {
            return true;
        }
        return await browser.permissions.remove({ origins })
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
        await this.remove(allPermissions.origins || []);
    }
}
