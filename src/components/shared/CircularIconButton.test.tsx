import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CircularIconButton } from './CircularIconButton';
import { Settings } from 'lucide-react';

describe('CircularIconButton', () => {
  it('renders with icon', () => {
    render(<CircularIconButton icon={<Settings data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders with circular-icon-button class', () => {
    const { container } = render(
      <CircularIconButton icon={<Settings />} />
    );
    expect(container.querySelector('.circular-icon-button')).toBeTruthy();
  });

  it('renders as a button element', () => {
    render(<CircularIconButton icon={<Settings />} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <CircularIconButton icon={<Settings />} onClick={onClick} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <CircularIconButton icon={<Settings />} onClick={onClick} disabled />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with aria-label', () => {
    render(<CircularIconButton icon={<Settings />} ariaLabel="Settings button" />);
    expect(screen.getByRole('button', { name: 'Settings button' })).toBeInTheDocument();
  });

  it('forwards className prop', () => {
    const { container } = render(
      <CircularIconButton icon={<Settings />} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });
});