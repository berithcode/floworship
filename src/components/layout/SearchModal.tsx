import { useState, useEffect, useRef } from 'react';
import './SearchModal.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="search-modal__overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="search-modal__input"
          type="text"
          placeholder="Buscar musicas, membros, escalas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search-modal__results">
          {query.length > 0 && (
            <div className="search-modal__group">
              <div className="search-modal__group-label">Musicas</div>
              <button className="search-modal__item" onClick={() => { onNavigate('/library'); onClose(); }}>
                Resultado para "{query}"
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}