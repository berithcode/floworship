import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarCircular } from './AvatarCircular';

describe('AvatarCircular', () => {
  it('renders image when src provided', () => {
    render(<AvatarCircular src="user.jpg" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'user.jpg');
  });

  it('renders fallback initials when no src', () => {
    render(<AvatarCircular fallback="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders fallback with class for styling', () => {
    const { container } = render(<AvatarCircular fallback="John Doe" />);
    const fallback = container.querySelector('.avatar-fallback');
    expect(fallback).toBeTruthy();
  });

  it('shows badge when badge prop is true', () => {
    const { container } = render(<AvatarCircular fallback="JD" badge />);
    const badge = container.querySelector('.avatar-badge');
    expect(badge).toBeTruthy();
  });

  it('displays single initial when fallback has one word', () => {
    render(<AvatarCircular fallback="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('handles fallback with more than 2 words (takes first 2)', () => {
    render(<AvatarCircular fallback="John Paul Smith" />);
    expect(screen.getByText('JP')).toBeInTheDocument();
  });

  it('uses custom size', () => {
    const { container } = render(<AvatarCircular fallback="JD" size={60} />);
    const avatar = container.querySelector('.avatar-circular');
    expect(avatar).toHaveStyle({ width: '60px', height: '60px' });
  });

  it('forwards className', () => {
    const { container } = render(<AvatarCircular fallback="JD" className="custom-avatar" />);
    expect(container.querySelector('.custom-avatar')).toBeTruthy();
  });
});