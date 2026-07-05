import { useState } from 'react';
import './MetronomePlaceholder.css';

export function MetronomePlaceholder() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="metronome-placeholder">
      <h3 className="metronome-placeholder__title">Metronomo</h3>
      <div className="metronome-placeholder__bpm">{bpm} BPM</div>
      <input
        type="range"
        min={30}
        max={300}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="metronome-placeholder__slider"
      />
      <div className="metronome-placeholder__range">
        <span>30</span>
        <span>300</span>
      </div>
      <button
        className={`metronome-placeholder__play ${isPlaying ? 'metronome-placeholder__play--active' : ''}`}
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? 'Pausar' : 'Tocar'}
      </button>
      <div className="metronome-placeholder__message">Motor de audio em breve</div>
    </div>
  );
}