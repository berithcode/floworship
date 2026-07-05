import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardItem } from './CardItem';
import { Play, Music } from 'lucide-react';

describe('CardItem', () => {
  it('renders title', () => {
    render(<CardItem title="Refrão" />);
    expect(screen.getByText('Refrão')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<CardItem title="Refrão" subtitle="1:30 – 2:10" />);
    expect(screen.getByText('1:30 – 2:10')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<CardItem title="Refrão" icon={<Music data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders action button when onAction provided', () => {
    render(
      <CardItem
        title="Refrão"
        onAction={vi.fn()}
        actionIcon={<Play data-testid="action-icon" />}
      />
    );
    expect(screen.getByTestId('action-icon')).toBeInTheDocument();
  });

  it('calls onAction when action button clicked', () => {
    const onAction = vi.fn();
    render(
      <CardItem
        title="Refrão"
        onAction={onAction}
        actionIcon={<Play />}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('has active class when active prop is true', () => {
    const { container } = render(<CardItem title="Refrão" active />);
    expect(container.querySelector('.card-item.active')).toBeTruthy();
  });

  it('forwards className', () => {
    const { container } = render(<CardItem title="Refrão" className="custom-card" />);
    expect(container.querySelector('.custom-card')).toBeTruthy();
  });
});