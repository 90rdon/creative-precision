import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendAdminAlert } from './bot';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('sendAdminAlert', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
        process.env.ADMIN_CHAT_ID = '-1001234567890';
    });

    afterEach(() => {
        delete process.env.TELEGRAM_BOT_TOKEN;
        delete process.env.ADMIN_CHAT_ID;
    });

    it('should return false if TELEGRAM_BOT_TOKEN is missing', async () => {
        delete process.env.TELEGRAM_BOT_TOKEN;
        const result = await sendAdminAlert('Test message');
        expect(result).toBe(false);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call the Telegram API with correct payload', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

        await sendAdminAlert('🚨 *Test Alert*');

        expect(mockFetch).toHaveBeenCalledOnce();
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('test-bot-token/sendMessage');
        const body = JSON.parse(options.body);
        expect(body.chat_id).toBe('-1001234567890');
        expect(body.text).toBe('🚨 *Test Alert*');
        expect(body.parse_mode).toBe('MarkdownV2');
    });

    it('should return true on a successful Telegram API call', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true });
        const result = await sendAdminAlert('Test');
        expect(result).toBe(true);
    });

    it('should return false when Telegram API returns non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            text: async () => 'Bad Request'
        });
        const result = await sendAdminAlert('Test');
        expect(result).toBe(false);
    });

    it('should return false and not throw when fetch throws a network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await sendAdminAlert('Test');
        expect(result).toBe(false);
    });
});
