import api from './api';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export const userService = {
    async getAll() {
        const response = await api.get<User[]>('/users');
        return response.data;
    },
    async getById(id: string) {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },
    async create(data: any) {
        const response = await api.post<User>('/users', data);
        return response.data;
    },
    async update(id: string, data: any) {
        const response = await api.patch<User>(`/users/${id}`, data);
        return response.data;
    },
    async delete(id: string) {
        await api.delete(`/users/${id}`);
    }
};
