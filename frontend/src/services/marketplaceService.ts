import api from './api';

export interface SuiteItem {
    id: string;
    name: string;
    description: string;
    isAssigned: boolean;
    licenseKey: string | null;
    expiresAt: string | null;
}

export interface ModuleItem {
    id: string;
    suiteId: string;
    name: string;
    description: string;
    isActive: boolean;
    isAssigned: boolean;
}

export const marketplaceService = {
    async getSuites() {
        const response = await api.get<SuiteItem[]>('/marketplace/suites');
        return response.data;
    },
    async getModules() {
        const response = await api.get<ModuleItem[]>('/marketplace/modules');
        return response.data;
    },
    async assignModule(moduleId: string, isActive: boolean) {
        const response = await api.post<ModuleItem>('/marketplace/modules/assign', {
            moduleId,
            isActive
        });
        return response.data;
    }
};
