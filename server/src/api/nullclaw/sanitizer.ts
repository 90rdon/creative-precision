/**
 * Generates safely sanitized inputs against basic prompt injection 
 * and tool execution attempts before sending to NullClaw internal gateway.
 */
export class ChatSanitizer {
    static sanitize(input: string): string {
        if (!input) return "";

        // 1. Defang dangerous system-level instruction patterns
        let sanitized = input
            .replace(/(ignore all previous instructions)/gi, "[REDACTED_INSTRUCTION]")
            .replace(/(system prompt)/gi, "[REDACTED_KEYWORD]")
            .replace(/(you are now)/gi, "[REDACTED_KEYWORD]")
            .replace(/(bypass filter)/gi, "[REDACTED_KEYWORD]");

        // 2. Escape or strip bash/terminal execution attempts
        // E.g. block users from typing `rm -rf /` or `chmod`
        sanitized = sanitized
            .replace(/(rm -rf|rmdir |\bchmod \b|\bchown \b|\bsudo \b|\/bin\/bash|\/bin\/sh)/gi, "[REDACTED_CMD]");

        // 3. Stripping pseudo-JSON tool calls if they attempt to manipulate the internal agent
        sanitized = sanitized.replace(/(\{(?:\s*)"?tool"?\s*:)/gi, "{ \"sanitized_tool\":");

        // 4. Limit repeating characters to prevent token exhaustion (e.g. "a" repeated 10000 times)
        sanitized = sanitized.replace(/(.)\1{200,}/g, "$1$1...");

        return sanitized.trim();
    }
}
