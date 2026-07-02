import { useParams } from 'react-router-dom';
import { TunerPlaceholder } from '../../components/study/TunerPlaceholder';
import { MetronomePlaceholder } from '../../components/study/MetronomePlaceholder';
import './StudyMode.css';

export function StudyMode() {
  const { songId } = useParams<{ songId: string }>();

  return (
    <div className="study-mode">
      <header className="study-mode__header">
        <h1 className="study-mode__title">Estudo</h1>
        <span className="study-mode__song-id">{songId}</span>
      </header>
      <div className="study-mode__content">
        <TunerPlaceholder />
        <MetronomePlaceholder />
      </div>
    </div>
  );
}