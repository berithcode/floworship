import { useState } from 'react';
import './TakeoverLayout.css';

interface TakeoverLayoutProps {
  children: React.ReactNode;
  onExit: () => void;
}

export function TakeoverLayout({ children, onExit }: TakeoverLayoutProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="takeover-layout">
      <button className="takeover-layout__exit" onClick={() => setShowConfirm(true)}>
        Sair da sessao
      </button>
      <div className="takeover-layout__content">{children}</div>
      {showConfirm && (
        <div className="takeover-layout__overlay">
          <div className="takeover-layout__dialog">
            <p>Tem certeza que deseja sair?</p>
            <div className="takeover-layout__actions">
              <button onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button onClick={onExit}>Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}