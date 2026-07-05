import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  CircularIconButton,
  PillToggle,
  CardItem,
  SliderHorizontal,
  DialCircular,
  BottomNavPill,
  AvatarCircular,
} from './index';
import { Settings, Play, Home, Music, Calendar, User } from 'lucide-react';

describe('Shared Components Integration', () => {
  it('renders all components in a sample page', () => {
    render(
      <div>
        <CircularIconButton icon={<Settings />} ariaLabel="Settings" />
        <PillToggle
          options={[
            { value: 'show', label: 'Mostrar' },
            { value: 'hide', label: 'Ocultar' },
          ]}
          value="show"
          onChange={() => {}}
        />
        <CardItem
          title="Refrão"
          subtitle="1:30 – 2:10"
          icon={<Music />}
          onAction={() => {}}
          actionIcon={<Play />}
        />
        <SliderHorizontal value={50} onChange={() => {}} aria-label="BPM" />
        <DialCircular value={75} label="Progress" />
        <BottomNavPill
          items={[
            { id: 'home', icon: <Home />, label: 'Início' },
            { id: 'music', icon: <Music />, label: 'Repertório' },
            { id: 'calendar', icon: <Calendar />, label: 'Escala' },
            { id: 'user', icon: <User />, label: 'Perfil' },
          ]}
          activeId="home"
          onSelect={() => {}}
        />
        <AvatarCircular fallback="John Doe" badge />
      </div>
    );

    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mostrar' })).toBeInTheDocument();
    expect(screen.getByText('Refrão')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('exports all 7 components from barrel', () => {
    expect(CircularIconButton).toBeDefined();
    expect(PillToggle).toBeDefined();
    expect(CardItem).toBeDefined();
    expect(SliderHorizontal).toBeDefined();
    expect(DialCircular).toBeDefined();
    expect(BottomNavPill).toBeDefined();
    expect(AvatarCircular).toBeDefined();
  });
});