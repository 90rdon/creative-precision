/**
 * Simple wrapper for sending alerts to the Admin Telegram channel.
 */
export async function sendAdminAlert(text: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID || "-1003873447811"; // Defaulting to the group ID provided in config

    if (!token) {
        console.warn('[TelegramBot] Missing TELEGRAM_BOT_TOKEN');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'MarkdownV2'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[TelegramBot] Telegram API error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[TelegramBot] Network/Fetch error:', err);
        return false;
    }
}
