import { DialCircular } from '../../components/shared';
import './TunerPlaceholder.css';

export function TunerPlaceholder() {
  return (
    <div className="tuner-placeholder">
      <h3 className="tuner-placeholder__title">Afinador</h3>
      <DialCircular value={50} size={160} label="A4" />
      <div className="tuner-placeholder__note">A4</div>
      <div className="tuner-placeholder__cents">0 cents</div>
      <div className="tuner-placeholder__presets">
        <span className="tuner-placeholder__preset tuner-placeholder__preset--active">Violao</span>
        <span className="tuner-placeholder__preset">Baixo</span>
        <span className="tuner-placeholder__preset">Cavaquinho</span>
      </div>
      <div className="tuner-placeholder__message">Motor de deteccao em breve</div>
    </div>
  );
}