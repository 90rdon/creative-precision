import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Landing } from './Landing';

describe('Landing Component', () => {
    it('renders landing title and button', () => {
        const onStart = vi.fn();
        render(<Landing onStart={onStart} />);
        expect(screen.getByText(/Clarify Ambition/i)).toBeInTheDocument();
        expect(screen.getByText(/Begin Reflection/i)).toBeInTheDocument();
    });

    it('calls onStart when button is clicked', () => {
        const onStart = vi.fn();
        render(<Landing onStart={onStart} />);
        const btn = screen.getByText(/Begin Reflection/i);
        fireEvent.click(btn);
        expect(onStart).toHaveBeenCalled();
    });
});
