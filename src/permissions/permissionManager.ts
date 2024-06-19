class PermissionManager {

    private async request(origins: string[]) {
        if (origins.length == 0) {
            return true;
        }
        return await browser.permissions.request({ origins });
    }

    private async remove(origins: string[]) {
        origins = origins.filter(x => !this.isRequired(x));
        if (origins.length == 0) {
            return false;
        }
        return await browser.permissions.remove({ origins })
    }

    private isRequired(origin: string) {
        return /^.*:\/\/.*\.tmetric\.com(?:\:\d+)?\/.*/i.test(origin);
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
        const origins = (allPermissions.origins || []).filter(o => !this.isRequired(o));
        if (origins.length == 0) {
            return true;
        }
        return await browser.permissions.remove({ origins });
    }
}
