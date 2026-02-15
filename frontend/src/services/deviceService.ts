import api from './api';

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR';

export interface Device {
    id: string;
    androidId: string;
    name: string;
    status: DeviceStatus;
    tenantId: string;
    capabilities?: any;
    createdAt: string;
    updatedAt: string;
}

export const deviceService = {
    async getAll() {
        const response = await api.get<Device[]>('/devices');
        return response.data;
    },
    async getById(id: string) {
        const response = await api.get<Device>(`/devices/${id}`);
        return response.data;
    },
    async create(data: any) {
        const response = await api.post<Device>('/devices', data);
        return response.data;
    },
    async update(id: string, data: any) {
        const response = await api.patch<Device>(`/devices/${id}`, data);
        return response.data;
    },
    async delete(id: string) {
        await api.delete(`/devices/${id}`);
    }
};
