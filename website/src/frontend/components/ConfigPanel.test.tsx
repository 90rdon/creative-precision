import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfigPanel } from './ConfigPanel';
import { DEFAULT_CONFIG } from '../constants';

describe('ConfigPanel Component', () => {
    it('renders correctly when open', () => {
        const onClose = vi.fn();
        const onSave = vi.fn();
        render(<ConfigPanel isOpen={true} onClose={onClose} config={DEFAULT_CONFIG} onSave={onSave} />);

        expect(screen.getByText('Configuration')).toBeInTheDocument();
        expect(screen.getByText('System Instruction (The Persona)')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        const { container } = render(<ConfigPanel isOpen={false} onClose={vi.fn()} config={DEFAULT_CONFIG} onSave={vi.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('calls onClose when cancel is clicked', () => {
        const onClose = vi.fn();
        render(<ConfigPanel isOpen={true} onClose={onClose} config={DEFAULT_CONFIG} onSave={vi.fn()} />);

        const cancelBtn = screen.getByText('Cancel');
        fireEvent.click(cancelBtn);
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onSave when save button is clicked with modified inputs', () => {
        const onSave = vi.fn();
        const onClose = vi.fn();
        render(<ConfigPanel isOpen={true} onClose={onClose} config={DEFAULT_CONFIG} onSave={onSave} />);

        const textareas = screen.getAllByRole('textbox');
        // first textarea is probably Initial Greeting
        fireEvent.change(textareas[0], { target: { value: 'New Greeting' } });

        const saveBtn = screen.getByText('Save Changes');
        fireEvent.click(saveBtn);

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            initialGreeting: 'New Greeting'
        }));
        expect(onClose).toHaveBeenCalled();
    });
});
