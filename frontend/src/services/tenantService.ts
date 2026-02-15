import api from './api';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export const tenantService = {
    async getAll() {
        const response = await api.get<Tenant[]>('/tenants');
        return response.data;
    },
    async getById(id: string) {
        const response = await api.get<Tenant>(`/tenants/${id}`);
        return response.data;
    },
    async create(data: Partial<Tenant>) {
        const response = await api.post<Tenant>('/tenants', data);
        return response.data;
    },
    async update(id: string, data: Partial<Tenant>) {
        const response = await api.patch<Tenant>(`/tenants/${id}`, data);
        return response.data;
    },
    async delete(id: string) {
        await api.delete(`/tenants/${id}`);
    }
};
