class PermissionManager {

    private static _isRequired = /^.*:\/\/.*\.tmetric\.com(?:\:\d+)?\/.*/i;

    private async pushChangesToStorage(key: string, origins: string[]) {
        if (origins?.length) {
            // see ContentScriptsRegistrator (TMET-10408)
            await browser.storage.session.set({ [key]: origins });
        }
    }

    private async request(origins: string[]) {
        if (!origins?.length) {
            return true;
        }
        const disabledOrigins = [] as string[];
        const enabledOrigins = [] as string[];
        for (const origin of origins) {
            const isEnabled = PermissionManager._isRequired.test(origin)
                || await browser.permissions.contains({ origins: [origin] });
            (isEnabled ? enabledOrigins : disabledOrigins).push(origin);
        }
        await this.pushChangesToStorage('originsAdded', enabledOrigins);
        if (!disabledOrigins.length) {
            return true;
        }
        const isEnabled = await browser.permissions.request({ origins: disabledOrigins });
        if (isEnabled) {
            await this.pushChangesToStorage('originsAdded', disabledOrigins);
        }
        return isEnabled;
    }

    private async remove(origins: string[]) {
        if (!origins?.length) {
            return;
        }
        const disabledOrigins = [] as string[];
        const enabledOrigins = [] as string[];
        for (const origin of origins) {
            const isEnabled = !PermissionManager._isRequired.test(origin)
                && await browser.permissions.contains({ origins: [origin] });
            (isEnabled ? enabledOrigins : disabledOrigins).push(origin);
        }
        await this.pushChangesToStorage('originsRemoved', disabledOrigins);
        if (enabledOrigins.length) {
            const isDisabled = await browser.permissions.remove({ origins: enabledOrigins });
            if (isDisabled) {
                await this.pushChangesToStorage('originsRemoved', enabledOrigins);
            }
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
        const origins = (allPermissions.origins || []).filter(x => !PermissionManager._isRequired.test(x));
        await this.remove(origins);
    }
}
