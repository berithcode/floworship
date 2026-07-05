import { useNavigate } from 'react-router-dom';
import './SessionEnd.css';

export function SessionEnd() {
  const navigate = useNavigate();

  return (
    <div className="session-end">
      <div className="session-end__content">
        <h1 className="session-end__title">Sessao encerrada</h1>
        <p className="session-end__message">A sessao de performance foi finalizada.</p>
        <button className="session-end__btn" onClick={() => navigate('/')}>
          Voltar ao inicio
        </button>
      </div>
    </div>
  );
}