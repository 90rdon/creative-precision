/**
 * Utility to format Telegram messages for the Admin.
 */
export class TelegramFormatter {
    /**
     * Escape characters for Telegram MarkdownV2
     */
    static escapeMarkdown(text: string): string {
        return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    }

    /**
     * Format a "New Session Started" alert.
     */
    static formatNewSessionAlert(sessionId: string): string {
        const escapedId = this.escapeMarkdown(sessionId);
        return `🚨 *New VIP Assessment Started*\n\n` +
            `*Session ID:* \`${escapedId}\` \n` +
            `*Status:* Active \\- OpenClaw Expert Mode`;
    }
}
