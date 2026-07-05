import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNavPill } from './BottomNavPill';
import { Home, Music, Calendar, User } from 'lucide-react';

describe('BottomNavPill', () => {
  const items = [
    { id: 'home', icon: <Home data-testid="home-icon" />, label: 'Início' },
    { id: 'repertorio', icon: <Music data-testid="music-icon" />, label: 'Repertório' },
    { id: 'escala', icon: <Calendar data-testid="calendar-icon" />, label: 'Escala' },
    { id: 'perfil', icon: <User data-testid="user-icon" />, label: 'Perfil' },
  ];

  it('renders all items', () => {
    render(<BottomNavPill items={items} activeId="home" onSelect={vi.fn()} />);
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Repertório')).toBeInTheDocument();
    expect(screen.getByText('Escala')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('marks active item', () => {
    render(<BottomNavPill items={items} activeId="repertorio" onSelect={vi.fn()} />);
    const activeButton = screen.getByRole('button', { name: 'Repertório' });
    expect(activeButton).toHaveAttribute('aria-current', 'page');
  });

  it('calls onSelect when item clicked', () => {
    const onSelect = vi.fn();
    render(<BottomNavPill items={items} activeId="home" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Repertório' }));
    expect(onSelect).toHaveBeenCalledWith('repertorio');
  });

  it('renders nothing when items is empty', () => {
    const { container } = render(<BottomNavPill items={[]} activeId="" onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('forwards className', () => {
    const { container } = render(
      <BottomNavPill items={items} activeId="home" onSelect={vi.fn()} className="custom-nav" />
    );
    expect(container.querySelector('.custom-nav')).toBeTruthy();
  });
});