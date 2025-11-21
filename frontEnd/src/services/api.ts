import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/',
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
    const response = await api.get(`/api/usuarios/${id}`);
    return response.data;
}

export const atualizarPerfil = async (dadosAtualizados: any) => {
    const response = await api.put('/api/usuarios/perfil', dadosAtualizados);
    return response.data.perfil;
}

export const uploadImagem = async (file: File, tipo: 'perfil' | 'consultorio' | 'video'): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);

    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        }
    });

    if(!response.ok){
        throw new Error('Falha no upload da imagem');
    }

    const data = await response.json();
    return data;
}
export default api;