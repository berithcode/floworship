import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PillToggle } from './PillToggle';

describe('PillToggle', () => {
  const options = [
    { value: 'show', label: 'Mostrar cifra' },
    { value: 'hide', label: 'Ocultar cifra' },
  ];

  it('renders all options', () => {
    render(<PillToggle options={options} value="show" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Mostrar cifra' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Ocultar cifra' })).toBeInTheDocument();
  });

  it('marks active option as checked', () => {
    render(<PillToggle options={options} value="hide" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Ocultar cifra' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Mostrar cifra' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn();
    render(<PillToggle options={options} value="show" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Ocultar cifra' }));
    expect(onChange).toHaveBeenCalledWith('hide');
  });

  it('renders nothing when options is empty', () => {
    const { container } = render(<PillToggle options={[]} value="" onChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('forwards className', () => {
    const { container } = render(
      <PillToggle options={options} value="show" onChange={vi.fn()} className="custom-toggle" />
    );
    expect(container.querySelector('.custom-toggle')).toBeTruthy();
  });
});