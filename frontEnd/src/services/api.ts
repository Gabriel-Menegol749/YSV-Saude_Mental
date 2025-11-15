import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/usuarios',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const buscarPerfil = async (id: string) => {
    const response = await api.get(`${id}`);
    return response.data;
}

export const atualizarPerfil = async (dadosAtualizados: any) => {
    const response = await api.put(`/perfil`, dadosAtualizados);
    return response.data.perfil;
}

export default api;