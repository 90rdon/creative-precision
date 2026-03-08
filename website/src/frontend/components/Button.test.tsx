import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
    it('renders children correctly', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('handles clicks', () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Click Me</Button>);
        fireEvent.click(screen.getByText('Click Me'));
        expect(onClick).toHaveBeenCalled();
    });

    it('can be disabled', () => {
        render(<Button disabled>Click Me</Button>);
        expect(screen.getByText('Click Me').closest('button')).toBeDisabled();
    });
});
