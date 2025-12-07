import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contextos/ContextoAutenticacao';
import './feedBackModal.css'

interface FeedBackModalProps {
    show: boolean;
    onClose: () => void;
    profissionalId: string;
    profissionalNome: string;
    onFeedbackSubmitted: () => void;
}

const FeedBackModal: React.FC<FeedBackModalProps> = ({ show, onClose, profissionalId, profissionalNome, onFeedbackSubmitted }) => {
    const { usuario } = useAuth();
    const [nota, setNota] = useState(0);
    const [comentario, setComentario] = useState('');
    const [anonimo, setAnonimo] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState(false);

    if (!show) return null;

    const handleSubmit = async () => {
        if (nota === 0) {
            setErro('Por favor, selecione uma nota.');
            return;
        }
        if (!usuario?._id) {
            setErro('Você precisa estar logado para enviar feedback.');
            return;
        }

        setEnviando(true);
        setErro(null);
        setSucesso(false);

        try {
            await api.post('/avaliacoes', {
                profissionalId,
                nota,
                comentario,
                anonimo
            });
            setSucesso(true);
            onFeedbackSubmitted();
            setTimeout(() => {
                onClose();
                setNota(0);
                setComentario('');
                setAnonimo(false);
                setEnviando(false);
                setSucesso(false);
            }, 2000); // Fecha após 2 segundos
        } catch (err) {
            console.error('Erro ao enviar feedback:', err);
            setErro('Falha ao enviar feedback. Tente novamente.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className='ModalOverlay'>
            <div className='ModalContent'>
                <h2>Como foi a consulta com {profissionalNome}?</h2>
                <p>Avalie e deixe um comentário!</p>

                <div className='StarRating'>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            className={star <= nota ? 'filled' : ''}
                            onClick={() => setNota(star)}
                        >
                            ⭐
                        </span>
                    ))}
                </div>

                <textarea
                    placeholder="Deixe seu comentário aqui..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    disabled={enviando}
                />

                <div className='CheckboxContainer'>
                    <input
                        type="checkbox"
                        id="anonimo"
                        checked={anonimo}
                        onChange={(e) => setAnonimo(e.target.checked)}
                        disabled={enviando}
                    />
                    <label htmlFor="anonimo">Publicar como anônimo</label>
                </div>

                {erro && <p style={{ color: 'red', marginBottom: '10px' }}>{erro}</p>}
                {sucesso && <p style={{ color: 'green', marginBottom: '10px' }}>Feedback enviado com sucesso!</p>}

                <button onClick={handleSubmit} disabled={enviando || nota === 0}>
                    {enviando ? 'Enviando...' : 'Enviar Feedback'}
                </button>
            </div>
        </div>
    );
};

export default FeedBackModal;
