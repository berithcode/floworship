import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SliderHorizontal } from './SliderHorizontal';

describe('SliderHorizontal', () => {
  it('renders with input element', () => {
    render(<SliderHorizontal value={50} onChange={vi.fn()} aria-label="BPM" />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('displays correct value', () => {
    render(<SliderHorizontal min={40} max={240} value={120} onChange={vi.fn()} aria-label="BPM" />);
    expect(screen.getByRole('slider')).toHaveValue('120');
  });

  it('calls onChange when slider moves', () => {
    const onChange = vi.fn();
    render(
      <SliderHorizontal min={40} max={240} value={60} onChange={onChange} aria-label="BPM" />
    );
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '80' } });
    expect(onChange).toHaveBeenCalledWith(80);
  });

  it('uses correct min and max attributes', () => {
    render(<SliderHorizontal min={30} max={300} value={120} onChange={vi.fn()} aria-label="BPM" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '30');
    expect(slider).toHaveAttribute('max', '300');
  });

  it('uses correct step', () => {
    render(<SliderHorizontal step={5} value={50} onChange={vi.fn()} aria-label="BPM" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('forwards className', () => {
    const { container } = render(
      <SliderHorizontal value={50} onChange={vi.fn()} className="custom-slider" aria-label="BPM" />
    );
    expect(container.querySelector('.custom-slider')).toBeTruthy();
  });
});