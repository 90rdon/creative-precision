import { describe, it, expect } from 'vitest';
import { TelegramFormatter } from './formatters';

describe('TelegramFormatter', () => {
    describe('escapeMarkdown', () => {
        it('should escape special MarkdownV2 characters', () => {
            const input = 'session-abc.123_new!';
            const result = TelegramFormatter.escapeMarkdown(input);
            // All MarkdownV2 special chars should be escaped
            expect(result).not.toMatch(/(?<!\\)[-_!.]/);
        });

        it('should not alter plain alphanumeric strings', () => {
            const input = 'sessionABC123';
            const result = TelegramFormatter.escapeMarkdown(input);
            expect(result).toBe('sessionABC123');
        });
    });

    describe('formatNewSessionAlert', () => {
        it('should include the session ID in the output', () => {
            const sessionId = 'abc-def-123';
            const result = TelegramFormatter.formatNewSessionAlert(sessionId);
            // The session ID (possibly escaped) should appear in the message
            expect(result).toContain('abc');
        });

        it('should include the VIP alert header', () => {
            const result = TelegramFormatter.formatNewSessionAlert('test-id');
            expect(result).toContain('New VIP Assessment Started');
        });

        it('should include the active status text', () => {
            const result = TelegramFormatter.formatNewSessionAlert('test-id');
            expect(result).toContain('Active');
        });
    });
});
