import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ✅ Buscar perfil por ID
export const buscarPerfil = async (id: string) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
}

// ✅ Buscar MEU perfil (logado)
export const buscarMeuPerfil = async () => {
    const response = await api.get('/usuarios/perfil');
    return response.data;
}

// ✅ Atualizar perfil
export const atualizarPerfil = async (dadosAtualizados: any) => {
    const response = await api.put('/usuarios/perfil', dadosAtualizados);
    return response.data;
}

export const uploadImagem = async (
    file: File,
    tipo: 'perfil' | 'consultorio' | 'video'
): Promise<{ url: string | string[] }> => { 
    const formData = new FormData();

    let fieldName: string;

    if (tipo === 'perfil') {
        fieldName = 'fotoPerfilFile';
    } else if (tipo === 'video') {
        fieldName = 'videoSobreMimFile';
    } else if (tipo === 'consultorio') {
        fieldName = 'fotoConsultorioFiles';
    } else {
        throw new Error(`Tipo de upload inválido: ${tipo}`);
    }

    formData.append(fieldName, file);

    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensagem || 'Falha no upload da imagem');
    }

    const data = await response.json();

    console.log('📥 Resposta do upload:', data);

    return { url: data.url };
}

export default api;
