import './OverrideConfirm.css';

interface OverrideConfirmProps {
  blockName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OverrideConfirm({ blockName, onConfirm, onCancel }: OverrideConfirmProps) {
  return (
    <div className="override-confirm__overlay">
      <div className="override-confirm__dialog">
        <h3 className="override-confirm__title">Confirmar Override</h3>
        <p className="override-confirm__message">
          Trigger override to <strong>{blockName}</strong>?
        </p>
        <div className="override-confirm__actions">
          <button className="override-confirm__btn override-confirm__btn--cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="override-confirm__btn override-confirm__btn--confirm" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}