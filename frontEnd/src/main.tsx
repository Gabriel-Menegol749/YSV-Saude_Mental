import React from "react"
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from "react-router-dom"
import { ProvedorAutenticacao } from "./contextos/ContextoAutenticacao.tsx"
import { NotificacoesProvider } from "./contextos/ContextoNotificacoes.tsx" // Importe o NotificacoesProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProvedorAutenticacao>
        <NotificacoesProvider>
          <App />
        </NotificacoesProvider>
      </ProvedorAutenticacao>
    </BrowserRouter>
  </React.StrictMode>
)
