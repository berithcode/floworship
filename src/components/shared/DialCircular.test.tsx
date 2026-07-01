import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DialCircular } from './DialCircular';

describe('DialCircular', () => {
  it('renders with default size (120px)', () => {
    const { container } = render(<DialCircular value={50} />);
    const dial = container.querySelector('.dial-circular');
    expect(dial).toBeTruthy();
    expect(dial).toHaveStyle({ width: '120px', height: '120px' });
  });

  it('displays value as percentage', () => {
    render(<DialCircular value={60} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('displays custom size', () => {
    const { container } = render(<DialCircular value={50} size={80} />);
    const dial = container.querySelector('.dial-circular');
    expect(dial).toHaveStyle({ width: '80px', height: '80px' });
  });

  it('displays label when provided', () => {
    render(<DialCircular value={50} label="Cents" />);
    expect(screen.getByText('Cents')).toBeInTheDocument();
  });

  it('clamps value below 0 to 0', () => {
    render(<DialCircular value={-10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('clamps value above 100 to 100', () => {
    render(<DialCircular value={150} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('rounds decimal values', () => {
    render(<DialCircular value={55.7} />);
    expect(screen.getByText('56%')).toBeInTheDocument();
  });

  it('forwards className', () => {
    const { container } = render(<DialCircular value={50} className="custom-dial" />);
    expect(container.querySelector('.custom-dial')).toBeTruthy();
  });

  it('renders SVG with correct viewBox', () => {
    const { container } = render(<DialCircular value={50} size={120} />);
    const svg = container.querySelector('.dial-circular-svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 120 120');
  });
});