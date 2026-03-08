
#compdef nullclaw

_nullclaw_root_completion() {
  local -a commands
  local -a options
  
  _arguments -C \
    "(--version -V)"{--version,-V}"[output the version number]" \
    "--dev[Dev profile: isolate state under ~/.nullclaw-dev, default gateway port 19001, and shift derived ports (browser/canvas)]" \
    "--profile[Use a named profile (isolates NULLCLAW_STATE_DIR/NULLCLAW_CONFIG_PATH under ~/.nullclaw-<name>)]" \
    "--log-level[Global log level override for file + console (silent|fatal|error|warn|info|debug|trace)]" \
    "--no-color[Disable ANSI colors]" \
    "1: :_values 'command' 'completion[Generate shell completion script]' 'setup[Initialize ~/.nullclaw/nullclaw.json and the agent workspace]' 'onboard[Interactive wizard to set up the gateway, workspace, and skills]' 'configure[Interactive setup wizard for credentials, channels, gateway, and agent defaults]' 'config[Non-interactive config helpers (get/set/unset). Run without subcommand for the setup wizard.]' 'doctor[Health checks + quick fixes for the gateway and channels]' 'dashboard[Open the Control UI with your current token]' 'reset[Reset local config/state (keeps the CLI installed)]' 'uninstall[Uninstall the gateway service + local data (CLI remains)]' 'message[Send, read, and manage messages and channel actions]' 'memory[Search, inspect, and reindex memory files]' 'agent[Run an agent turn via the Gateway (use --local for embedded)]' 'agents[Manage isolated agents (workspaces + auth + routing)]' 'status[Show channel health and recent session recipients]' 'health[Fetch health from the running gateway]' 'sessions[List stored conversation sessions]' 'browser[Manage NullClaw'\''s dedicated browser (Chrome/Chromium)]' 'acp[Run an ACP bridge backed by the Gateway]' 'gateway[Run, inspect, and query the WebSocket Gateway]' 'daemon[Manage the Gateway service (launchd/systemd/schtasks)]' 'logs[Tail gateway file logs via RPC]' 'system[System tools (events, heartbeat, presence)]' 'models[Model discovery, scanning, and configuration]' 'approvals[Manage exec approvals (gateway or node host)]' 'nodes[Manage gateway-owned nodes (pairing, status, invoke, and media)]' 'devices[Device pairing and auth tokens]' 'node[Run and manage the headless node host service]' 'sandbox[Manage sandbox containers (Docker-based agent isolation)]' 'tui[Open a terminal UI connected to the Gateway]' 'cron[Manage cron jobs (via Gateway)]' 'dns[DNS helpers for wide-area discovery (Tailscale + CoreDNS)]' 'docs[Search the live NullClaw docs]' 'hooks[Manage internal agent hooks]' 'webhooks[Webhook helpers and integrations]' 'qr[Generate an iOS pairing QR code and setup code]' 'clawbot[Legacy clawbot command aliases]' 'pairing[Secure DM pairing (approve inbound requests)]' 'plugins[Manage NullClaw plugins and extensions]' 'channels[Manage connected chat channels and accounts]' 'directory[Lookup contact and group IDs (self, peers, groups) for supported chat channels]' 'security[Audit local config and state for common security foot-guns]' 'secrets[Secrets runtime controls]' 'skills[List and inspect available skills]' 'update[Update NullClaw and inspect update channel status]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (completion) _nullclaw_completion ;;
        (setup) _nullclaw_setup ;;
        (onboard) _nullclaw_onboard ;;
        (configure) _nullclaw_configure ;;
        (config) _nullclaw_config ;;
        (doctor) _nullclaw_doctor ;;
        (dashboard) _nullclaw_dashboard ;;
        (reset) _nullclaw_reset ;;
        (uninstall) _nullclaw_uninstall ;;
        (message) _nullclaw_message ;;
        (memory) _nullclaw_memory ;;
        (agent) _nullclaw_agent ;;
        (agents) _nullclaw_agents ;;
        (status) _nullclaw_status ;;
        (health) _nullclaw_health ;;
        (sessions) _nullclaw_sessions ;;
        (browser) _nullclaw_browser ;;
        (acp) _nullclaw_acp ;;
        (gateway) _nullclaw_gateway ;;
        (daemon) _nullclaw_daemon ;;
        (logs) _nullclaw_logs ;;
        (system) _nullclaw_system ;;
        (models) _nullclaw_models ;;
        (approvals) _nullclaw_approvals ;;
        (nodes) _nullclaw_nodes ;;
        (devices) _nullclaw_devices ;;
        (node) _nullclaw_node ;;
        (sandbox) _nullclaw_sandbox ;;
        (tui) _nullclaw_tui ;;
        (cron) _nullclaw_cron ;;
        (dns) _nullclaw_dns ;;
        (docs) _nullclaw_docs ;;
        (hooks) _nullclaw_hooks ;;
        (webhooks) _nullclaw_webhooks ;;
        (qr) _nullclaw_qr ;;
        (clawbot) _nullclaw_clawbot ;;
        (pairing) _nullclaw_pairing ;;
        (plugins) _nullclaw_plugins ;;
        (channels) _nullclaw_channels ;;
        (directory) _nullclaw_directory ;;
        (security) _nullclaw_security ;;
        (secrets) _nullclaw_secrets ;;
        (skills) _nullclaw_skills ;;
        (update) _nullclaw_update ;;
      esac
      ;;
  esac
}


_nullclaw_completion() {
  _arguments -C \
    "(--shell -s)"{--shell,-s}"[Shell to generate completion for (default: zsh)]" \
    "(--install -i)"{--install,-i}"[Install completion script to shell profile]" \
    "--write-state[Write completion scripts to $NULLCLAW_STATE_DIR/completions (no stdout)]" \
    "(--yes -y)"{--yes,-y}"[Skip confirmation (non-interactive)]"
}

_nullclaw_setup() {
  _arguments -C \
    "--workspace[Agent workspace directory (default: ~/.nullclaw/workspace; stored as agents.defaults.workspace)]" \
    "--wizard[Run the interactive onboarding wizard]" \
    "--non-interactive[Run the wizard without prompts]" \
    "--mode[Wizard mode: local|remote]" \
    "--remote-url[Remote Gateway WebSocket URL]" \
    "--remote-token[Remote Gateway token (optional)]"
}

_nullclaw_onboard() {
  _arguments -C \
    "--workspace[Agent workspace directory (default: ~/.nullclaw/workspace)]" \
    "--reset[Reset config + credentials + sessions before running wizard (workspace only with --reset-scope full)]" \
    "--reset-scope[Reset scope: config|config+creds+sessions|full]" \
    "--non-interactive[Run without prompts]" \
    "--accept-risk[Acknowledge that agents are powerful and full system access is risky (required for --non-interactive)]" \
    "--flow[Wizard flow: quickstart|advanced|manual]" \
    "--mode[Wizard mode: local|remote]" \
    "--auth-choice[Auth: token|openai-codex|chutes|vllm|apiKey|openai-api-key|mistral-api-key|openrouter-api-key|kilocode-api-key|ai-gateway-api-key|cloudflare-ai-gateway-api-key|moonshot-api-key|kimi-code-api-key|gemini-api-key|zai-api-key|xiaomi-api-key|minimax-api|synthetic-api-key|venice-api-key|together-api-key|huggingface-api-key|opencode-zen|xai-api-key|litellm-api-key|qianfan-api-key|volcengine-api-key|byteplus-api-key|moonshot-api-key-cn|github-copilot|gemini-api-key|google-gemini-cli|zai-api-key|zai-coding-global|zai-coding-cn|zai-global|zai-cn|xiaomi-api-key|minimax-portal|qwen-portal|copilot-proxy|apiKey|opencode-zen|minimax-api|minimax-api-key-cn|minimax-api-lightning|custom-api-key|skip|setup-token|oauth|claude-cli|codex-cli|minimax-cloud|minimax]" \
    "--token-provider[Token provider id (non-interactive; used with --auth-choice token)]" \
    "--token[Token value (non-interactive; used with --auth-choice token)]" \
    "--token-profile-id[Auth profile id (non-interactive; default: <provider>:manual)]" \
    "--token-expires-in[Optional token expiry duration (e.g. 365d, 12h)]" \
    "--secret-input-mode[API key persistence mode: plaintext|ref (default: plaintext)]" \
    "--cloudflare-ai-gateway-account-id[Cloudflare Account ID]" \
    "--cloudflare-ai-gateway-gateway-id[Cloudflare AI Gateway ID]" \
    "--anthropic-api-key[Anthropic API key]" \
    "--openai-api-key[OpenAI API key]" \
    "--mistral-api-key[Mistral API key]" \
    "--openrouter-api-key[OpenRouter API key]" \
    "--kilocode-api-key[Kilo Gateway API key]" \
    "--ai-gateway-api-key[Vercel AI Gateway API key]" \
    "--cloudflare-ai-gateway-api-key[Cloudflare AI Gateway API key]" \
    "--moonshot-api-key[Moonshot API key]" \
    "--kimi-code-api-key[Kimi Coding API key]" \
    "--gemini-api-key[Gemini API key]" \
    "--zai-api-key[Z.AI API key]" \
    "--xiaomi-api-key[Xiaomi API key]" \
    "--minimax-api-key[MiniMax API key]" \
    "--synthetic-api-key[Synthetic API key]" \
    "--venice-api-key[Venice API key]" \
    "--together-api-key[Together AI API key]" \
    "--huggingface-api-key[Hugging Face API key (HF token)]" \
    "--opencode-zen-api-key[OpenCode Zen API key]" \
    "--xai-api-key[xAI API key]" \
    "--litellm-api-key[LiteLLM API key]" \
    "--qianfan-api-key[QIANFAN API key]" \
    "--volcengine-api-key[Volcano Engine API key]" \
    "--byteplus-api-key[BytePlus API key]" \
    "--custom-base-url[Custom provider base URL]" \
    "--custom-api-key[Custom provider API key (optional)]" \
    "--custom-model-id[Custom provider model ID]" \
    "--custom-provider-id[Custom provider ID (optional; auto-derived by default)]" \
    "--custom-compatibility[Custom provider API compatibility: openai|anthropic (default: openai)]" \
    "--gateway-port[Gateway port]" \
    "--gateway-bind[Gateway bind: loopback|tailnet|lan|auto|custom]" \
    "--gateway-auth[Gateway auth: token|password]" \
    "--gateway-token[Gateway token (token auth)]" \
    "--gateway-password[Gateway password (password auth)]" \
    "--remote-url[Remote Gateway WebSocket URL]" \
    "--remote-token[Remote Gateway token (optional)]" \
    "--tailscale[Tailscale: off|serve|funnel]" \
    "--tailscale-reset-on-exit[Reset tailscale serve/funnel on exit]" \
    "--install-daemon[Install gateway service]" \
    "--no-install-daemon[Skip gateway service install]" \
    "--skip-daemon[Skip gateway service install]" \
    "--daemon-runtime[Daemon runtime: node|bun]" \
    "--skip-channels[Skip channel setup]" \
    "--skip-skills[Skip skills setup]" \
    "--skip-health[Skip health check]" \
    "--skip-ui[Skip Control UI/TUI prompts]" \
    "--node-manager[Node manager for skills: npm|pnpm|bun]" \
    "--json[Output JSON summary]"
}

_nullclaw_configure() {
  _arguments -C \
    "--section[Configuration sections (repeatable). Options: workspace, model, web, gateway, daemon, channels, skills, health]"
}

_nullclaw_config_get() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_config_set() {
  _arguments -C \
    "--strict-json[Strict JSON5 parsing (error instead of raw string fallback)]" \
    "--json[Legacy alias for --strict-json]"
}

_nullclaw_config_unset() {
  _arguments -C \
    
}

_nullclaw_config() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--section[Configure wizard sections (repeatable). Use with no subcommand.]" \
    "1: :_values 'command' 'get[Get a config value by dot path]' 'set[Set a config value by dot path]' 'unset[Remove a config value by dot path]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (get) _nullclaw_config_get ;;
        (set) _nullclaw_config_set ;;
        (unset) _nullclaw_config_unset ;;
      esac
      ;;
  esac
}

_nullclaw_doctor() {
  _arguments -C \
    "--no-workspace-suggestions[Disable workspace memory system suggestions]" \
    "--yes[Accept defaults without prompting]" \
    "--repair[Apply recommended repairs without prompting]" \
    "--fix[Apply recommended repairs (alias for --repair)]" \
    "--force[Apply aggressive repairs (overwrites custom service config)]" \
    "--non-interactive[Run without prompts (safe migrations only)]" \
    "--generate-gateway-token[Generate and configure a gateway token]" \
    "--deep[Scan system services for extra gateway installs]"
}

_nullclaw_dashboard() {
  _arguments -C \
    "--no-open[Print URL but do not launch a browser]"
}

_nullclaw_reset() {
  _arguments -C \
    "--scope[config|config+creds+sessions|full (default: interactive prompt)]" \
    "--yes[Skip confirmation prompts]" \
    "--non-interactive[Disable prompts (requires --scope + --yes)]" \
    "--dry-run[Print actions without removing files]"
}

_nullclaw_uninstall() {
  _arguments -C \
    "--service[Remove the gateway service]" \
    "--state[Remove state + config]" \
    "--workspace[Remove workspace dirs]" \
    "--app[Remove the macOS app]" \
    "--all[Remove service + state + workspace + app]" \
    "--yes[Skip confirmation prompts]" \
    "--non-interactive[Disable prompts (requires --yes)]" \
    "--dry-run[Print actions without removing files]"
}

_nullclaw_message_send() {
  _arguments -C \
    "(--message -m)"{--message,-m}"[Message body (required unless --media is set)]" \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--media[Attach media (image/audio/video/document). Accepts local paths or URLs.]" \
    "--buttons[Telegram inline keyboard buttons as JSON (array of button rows)]" \
    "--components[Discord components payload as JSON]" \
    "--card[Adaptive Card JSON object (when supported by the channel)]" \
    "--reply-to[Reply-to message id]" \
    "--thread-id[Thread id (Telegram forum thread)]" \
    "--gif-playback[Treat video media as GIF playback (WhatsApp only).]" \
    "--silent[Send message silently without notification (Telegram + Discord)]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_broadcast() {
  _arguments -C \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--targets[Recipient/channel targets (same format as --target); accepts ids or names when the directory is available.]" \
    "--message[Message to send]" \
    "--media[Media URL]"
}

_nullclaw_message_poll() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--poll-question[Poll question]" \
    "--poll-option[Poll option (repeat 2-12 times)]" \
    "--poll-multi[Allow multiple selections]" \
    "--poll-duration-hours[Poll duration in hours (Discord)]" \
    "--poll-duration-seconds[Poll duration in seconds (Telegram; 5-600)]" \
    "--poll-anonymous[Send an anonymous poll (Telegram)]" \
    "--poll-public[Send a non-anonymous poll (Telegram)]" \
    "(--message -m)"{--message,-m}"[Optional message body]" \
    "--silent[Send poll silently without notification (Telegram + Discord where supported)]" \
    "--thread-id[Thread id (Telegram forum topic / Slack thread ts)]"
}

_nullclaw_message_react() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--message-id[Message id]" \
    "--emoji[Emoji for reactions]" \
    "--remove[Remove reaction]" \
    "--participant[WhatsApp reaction participant]" \
    "--from-me[WhatsApp reaction fromMe]" \
    "--target-author[Signal reaction target author (uuid or phone)]" \
    "--target-author-uuid[Signal reaction target author uuid]"
}

_nullclaw_message_reactions() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--message-id[Message id]" \
    "--limit[Result limit]"
}

_nullclaw_message_read() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--limit[Result limit]" \
    "--before[Read/search before id]" \
    "--after[Read/search after id]" \
    "--around[Read around id]" \
    "--include-thread[Include thread replies (Discord)]"
}

_nullclaw_message_edit() {
  _arguments -C \
    "--message-id[Message id]" \
    "(--message -m)"{--message,-m}"[Message body]" \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--thread-id[Thread id (Telegram forum thread)]"
}

_nullclaw_message_delete() {
  _arguments -C \
    "--message-id[Message id]" \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_pin() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--message-id[Message id]"
}

_nullclaw_message_unpin() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--message-id[Message id]"
}

_nullclaw_message_pins() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--limit[Result limit]"
}

_nullclaw_message_permissions() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_search() {
  _arguments -C \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--guild-id[Guild id]" \
    "--query[Search query]" \
    "--channel-id[Channel id]" \
    "--channel-ids[Channel id (repeat)]" \
    "--author-id[Author id]" \
    "--author-ids[Author id (repeat)]" \
    "--limit[Result limit]"
}

_nullclaw_message_thread_create() {
  _arguments -C \
    "--thread-name[Thread name]" \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--message-id[Message id (optional)]" \
    "(--message -m)"{--message,-m}"[Initial thread message text]" \
    "--auto-archive-min[Thread auto-archive minutes]"
}

_nullclaw_message_thread_list() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--channel-id[Channel id]" \
    "--include-archived[Include archived threads]" \
    "--before[Read/search before id]" \
    "--limit[Result limit]"
}

_nullclaw_message_thread_reply() {
  _arguments -C \
    "(--message -m)"{--message,-m}"[Message body]" \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--media[Attach media (image/audio/video/document). Accepts local paths or URLs.]" \
    "--reply-to[Reply-to message id]"
}

_nullclaw_message_thread() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'create[Create a thread]' 'list[List threads]' 'reply[Reply in a thread]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (create) _nullclaw_message_thread_create ;;
        (list) _nullclaw_message_thread_list ;;
        (reply) _nullclaw_message_thread_reply ;;
      esac
      ;;
  esac
}

_nullclaw_message_emoji_list() {
  _arguments -C \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--guild-id[Guild id (Discord)]"
}

_nullclaw_message_emoji_upload() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--emoji-name[Emoji name]" \
    "--media[Emoji media (path or URL)]" \
    "--role-ids[Role id (repeat)]"
}

_nullclaw_message_emoji() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List emojis]' 'upload[Upload an emoji]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_message_emoji_list ;;
        (upload) _nullclaw_message_emoji_upload ;;
      esac
      ;;
  esac
}

_nullclaw_message_sticker_send() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--sticker-id[Sticker id (repeat)]" \
    "(--message -m)"{--message,-m}"[Optional message body]"
}

_nullclaw_message_sticker_upload() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--sticker-name[Sticker name]" \
    "--sticker-desc[Sticker description]" \
    "--sticker-tags[Sticker tags]" \
    "--media[Sticker media (path or URL)]"
}

_nullclaw_message_sticker() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'send[Send stickers]' 'upload[Upload a sticker]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (send) _nullclaw_message_sticker_send ;;
        (upload) _nullclaw_message_sticker_upload ;;
      esac
      ;;
  esac
}

_nullclaw_message_role_info() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_role_add() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--user-id[User id]" \
    "--role-id[Role id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_role_remove() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--user-id[User id]" \
    "--role-id[Role id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_role() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'info[List roles]' 'add[Add role to a member]' 'remove[Remove role from a member]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (info) _nullclaw_message_role_info ;;
        (add) _nullclaw_message_role_add ;;
        (remove) _nullclaw_message_role_remove ;;
      esac
      ;;
  esac
}

_nullclaw_message_channel_info() {
  _arguments -C \
    "(--target -t)"{--target,-t}"[Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack channel/user, or iMessage handle/chat_id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_channel_list() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_channel() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'info[Fetch channel info]' 'list[List channels]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (info) _nullclaw_message_channel_info ;;
        (list) _nullclaw_message_channel_list ;;
      esac
      ;;
  esac
}

_nullclaw_message_member_info() {
  _arguments -C \
    "--user-id[User id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--guild-id[Guild id (Discord)]"
}

_nullclaw_message_member() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'info[Fetch member info]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (info) _nullclaw_message_member_info ;;
      esac
      ;;
  esac
}

_nullclaw_message_voice_status() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--user-id[User id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_voice() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'status[Fetch voice status]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (status) _nullclaw_message_voice_status ;;
      esac
      ;;
  esac
}

_nullclaw_message_event_list() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]"
}

_nullclaw_message_event_create() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--event-name[Event name]" \
    "--start-time[Event start time]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--end-time[Event end time]" \
    "--desc[Event description]" \
    "--channel-id[Channel id]" \
    "--location[Event location]" \
    "--event-type[Event type]"
}

_nullclaw_message_event() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List scheduled events]' 'create[Create a scheduled event]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_message_event_list ;;
        (create) _nullclaw_message_event_create ;;
      esac
      ;;
  esac
}

_nullclaw_message_timeout() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--user-id[User id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--duration-min[Timeout duration minutes]" \
    "--until[Timeout until]" \
    "--reason[Moderation reason]"
}

_nullclaw_message_kick() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--user-id[User id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--reason[Moderation reason]"
}

_nullclaw_message_ban() {
  _arguments -C \
    "--guild-id[Guild id]" \
    "--user-id[User id]" \
    "--channel[Channel: telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon]" \
    "--account[Channel account id (accountId)]" \
    "--json[Output result as JSON]" \
    "--dry-run[Print payload and skip sending]" \
    "--verbose[Verbose logging]" \
    "--reason[Moderation reason]" \
    "--delete-days[Ban delete message days]"
}

_nullclaw_message() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'send[Send a message]' 'broadcast[Broadcast a message to multiple targets]' 'poll[Send a poll]' 'react[Add or remove a reaction]' 'reactions[List reactions on a message]' 'read[Read recent messages]' 'edit[Edit a message]' 'delete[Delete a message]' 'pin[Pin a message]' 'unpin[Unpin a message]' 'pins[List pinned messages]' 'permissions[Fetch channel permissions]' 'search[Search Discord messages]' 'thread[Thread actions]' 'emoji[Emoji actions]' 'sticker[Sticker actions]' 'role[Role actions]' 'channel[Channel actions]' 'member[Member actions]' 'voice[Voice actions]' 'event[Event actions]' 'timeout[Timeout a member]' 'kick[Kick a member]' 'ban[Ban a member]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (send) _nullclaw_message_send ;;
        (broadcast) _nullclaw_message_broadcast ;;
        (poll) _nullclaw_message_poll ;;
        (react) _nullclaw_message_react ;;
        (reactions) _nullclaw_message_reactions ;;
        (read) _nullclaw_message_read ;;
        (edit) _nullclaw_message_edit ;;
        (delete) _nullclaw_message_delete ;;
        (pin) _nullclaw_message_pin ;;
        (unpin) _nullclaw_message_unpin ;;
        (pins) _nullclaw_message_pins ;;
        (permissions) _nullclaw_message_permissions ;;
        (search) _nullclaw_message_search ;;
        (thread) _nullclaw_message_thread ;;
        (emoji) _nullclaw_message_emoji ;;
        (sticker) _nullclaw_message_sticker ;;
        (role) _nullclaw_message_role ;;
        (channel) _nullclaw_message_channel ;;
        (member) _nullclaw_message_member ;;
        (voice) _nullclaw_message_voice ;;
        (event) _nullclaw_message_event ;;
        (timeout) _nullclaw_message_timeout ;;
        (kick) _nullclaw_message_kick ;;
        (ban) _nullclaw_message_ban ;;
      esac
      ;;
  esac
}

_nullclaw_memory_status() {
  _arguments -C \
    "--agent[Agent id (default: default agent)]" \
    "--json[Print JSON]" \
    "--deep[Probe embedding provider availability]" \
    "--index[Reindex if dirty (implies --deep)]" \
    "--verbose[Verbose logging]"
}

_nullclaw_memory_index() {
  _arguments -C \
    "--agent[Agent id (default: default agent)]" \
    "--force[Force full reindex]" \
    "--verbose[Verbose logging]"
}

_nullclaw_memory_search() {
  _arguments -C \
    "--query[Search query (alternative to positional argument)]" \
    "--agent[Agent id (default: default agent)]" \
    "--max-results[Max results]" \
    "--min-score[Minimum score]" \
    "--json[Print JSON]"
}

_nullclaw_memory() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'status[Show memory search index status]' 'index[Reindex memory files]' 'search[Search memory files]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (status) _nullclaw_memory_status ;;
        (index) _nullclaw_memory_index ;;
        (search) _nullclaw_memory_search ;;
      esac
      ;;
  esac
}

_nullclaw_agent() {
  _arguments -C \
    "(--message -m)"{--message,-m}"[Message body for the agent]" \
    "(--to -t)"{--to,-t}"[Recipient number in E.164 used to derive the session key]" \
    "--session-id[Use an explicit session id]" \
    "--agent[Agent id (overrides routing bindings)]" \
    "--thinking[Thinking level: off | minimal | low | medium | high]" \
    "--verbose[Persist agent verbose level for the session]" \
    "--channel[Delivery channel: last|telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon (omit to use the main session channel)]" \
    "--reply-to[Delivery target override (separate from session routing)]" \
    "--reply-channel[Delivery channel override (separate from routing)]" \
    "--reply-account[Delivery account id override]" \
    "--local[Run the embedded agent locally (requires model provider API keys in your shell)]" \
    "--deliver[Send the agent'\''s reply back to the selected channel]" \
    "--json[Output result as JSON]" \
    "--timeout[Override agent command timeout (seconds, default 600 or config value)]"
}

_nullclaw_agents_list() {
  _arguments -C \
    "--json[Output JSON instead of text]" \
    "--bindings[Include routing bindings]"
}

_nullclaw_agents_bindings() {
  _arguments -C \
    "--agent[Filter by agent id]" \
    "--json[Output JSON instead of text]"
}

_nullclaw_agents_bind() {
  _arguments -C \
    "--agent[Agent id (defaults to current default agent)]" \
    "--bind[Binding to add (repeatable). If omitted, accountId is resolved by channel defaults/hooks.]" \
    "--json[Output JSON summary]"
}

_nullclaw_agents_unbind() {
  _arguments -C \
    "--agent[Agent id (defaults to current default agent)]" \
    "--bind[Binding to remove (repeatable)]" \
    "--all[Remove all bindings for this agent]" \
    "--json[Output JSON summary]"
}

_nullclaw_agents_add() {
  _arguments -C \
    "--workspace[Workspace directory for the new agent]" \
    "--model[Model id for this agent]" \
    "--agent-dir[Agent state directory for this agent]" \
    "--bind[Route channel binding (repeatable)]" \
    "--non-interactive[Disable prompts; requires --workspace]" \
    "--json[Output JSON summary]"
}

_nullclaw_agents_set_identity() {
  _arguments -C \
    "--agent[Agent id to update]" \
    "--workspace[Workspace directory used to locate the agent + IDENTITY.md]" \
    "--identity-file[Explicit IDENTITY.md path to read]" \
    "--from-identity[Read values from IDENTITY.md]" \
    "--name[Identity name]" \
    "--theme[Identity theme]" \
    "--emoji[Identity emoji]" \
    "--avatar[Identity avatar (workspace path, http(s) URL, or data URI)]" \
    "--json[Output JSON summary]"
}

_nullclaw_agents_delete() {
  _arguments -C \
    "--force[Skip confirmation]" \
    "--json[Output JSON summary]"
}

_nullclaw_agents() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List configured agents]' 'bindings[List routing bindings]' 'bind[Add routing bindings for an agent]' 'unbind[Remove routing bindings for an agent]' 'add[Add a new isolated agent]' 'set-identity[Update an agent identity (name/theme/emoji/avatar)]' 'delete[Delete an agent and prune workspace/state]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_agents_list ;;
        (bindings) _nullclaw_agents_bindings ;;
        (bind) _nullclaw_agents_bind ;;
        (unbind) _nullclaw_agents_unbind ;;
        (add) _nullclaw_agents_add ;;
        (set-identity) _nullclaw_agents_set_identity ;;
        (delete) _nullclaw_agents_delete ;;
      esac
      ;;
  esac
}

_nullclaw_status() {
  _arguments -C \
    "--json[Output JSON instead of text]" \
    "--all[Full diagnosis (read-only, pasteable)]" \
    "--usage[Show model provider usage/quota snapshots]" \
    "--deep[Probe channels (WhatsApp Web + Telegram + Discord + Slack + Signal)]" \
    "--timeout[Probe timeout in milliseconds]" \
    "--verbose[Verbose logging]" \
    "--debug[Alias for --verbose]"
}

_nullclaw_health() {
  _arguments -C \
    "--json[Output JSON instead of text]" \
    "--timeout[Connection timeout in milliseconds]" \
    "--verbose[Verbose logging]" \
    "--debug[Alias for --verbose]"
}

_nullclaw_sessions_cleanup() {
  _arguments -C \
    "--store[Path to session store (default: resolved from config)]" \
    "--agent[Agent id to maintain (default: configured default agent)]" \
    "--all-agents[Run maintenance across all configured agents]" \
    "--dry-run[Preview maintenance actions without writing]" \
    "--enforce[Apply maintenance even when configured mode is warn]" \
    "--fix-missing[Remove store entries whose transcript files are missing (bypasses age/count retention)]" \
    "--active-key[Protect this session key from budget-eviction]" \
    "--json[Output JSON]"
}

_nullclaw_sessions() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--json[Output as JSON]" \
    "--verbose[Verbose logging]" \
    "--store[Path to session store (default: resolved from config)]" \
    "--agent[Agent id to inspect (default: configured default agent)]" \
    "--all-agents[Aggregate sessions across all configured agents]" \
    "--active[Only show sessions updated within the past N minutes]" \
    "1: :_values 'command' 'cleanup[Run session-store maintenance now]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (cleanup) _nullclaw_sessions_cleanup ;;
      esac
      ;;
  esac
}

_nullclaw_browser_status() {
  _arguments -C \
    
}

_nullclaw_browser_start() {
  _arguments -C \
    
}

_nullclaw_browser_stop() {
  _arguments -C \
    
}

_nullclaw_browser_reset_profile() {
  _arguments -C \
    
}

_nullclaw_browser_tabs() {
  _arguments -C \
    
}

_nullclaw_browser_tab_new() {
  _arguments -C \
    
}

_nullclaw_browser_tab_select() {
  _arguments -C \
    
}

_nullclaw_browser_tab_close() {
  _arguments -C \
    
}

_nullclaw_browser_tab() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'new[Open a new tab (about:blank)]' 'select[Focus tab by index (1-based)]' 'close[Close tab by index (1-based); default: first tab]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (new) _nullclaw_browser_tab_new ;;
        (select) _nullclaw_browser_tab_select ;;
        (close) _nullclaw_browser_tab_close ;;
      esac
      ;;
  esac
}

_nullclaw_browser_open() {
  _arguments -C \
    
}

_nullclaw_browser_focus() {
  _arguments -C \
    
}

_nullclaw_browser_close() {
  _arguments -C \
    
}

_nullclaw_browser_profiles() {
  _arguments -C \
    
}

_nullclaw_browser_create_profile() {
  _arguments -C \
    "--name[Profile name (lowercase, numbers, hyphens)]" \
    "--color[Profile color (hex format, e.g. #0066CC)]" \
    "--cdp-url[CDP URL for remote Chrome (http/https)]" \
    "--driver[Profile driver (nullclaw|extension). Default: nullclaw]"
}

_nullclaw_browser_delete_profile() {
  _arguments -C \
    "--name[Profile name to delete]"
}

_nullclaw_browser_extension_install() {
  _arguments -C \
    
}

_nullclaw_browser_extension_path() {
  _arguments -C \
    
}

_nullclaw_browser_extension() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'install[Install the Chrome extension to a stable local path]' 'path[Print the path to the installed Chrome extension (load unpacked)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (install) _nullclaw_browser_extension_install ;;
        (path) _nullclaw_browser_extension_path ;;
      esac
      ;;
  esac
}

_nullclaw_browser_screenshot() {
  _arguments -C \
    "--full-page[Capture full scrollable page]" \
    "--ref[ARIA ref from ai snapshot]" \
    "--element[CSS selector for element screenshot]" \
    "--type[Output type (default: png)]"
}

_nullclaw_browser_snapshot() {
  _arguments -C \
    "--format[Snapshot format (default: ai)]" \
    "--target-id[CDP target id (or unique prefix)]" \
    "--limit[Max nodes (default: 500/800)]" \
    "--mode[Snapshot preset (efficient)]" \
    "--efficient[Use the efficient snapshot preset]" \
    "--interactive[Role snapshot: interactive elements only]" \
    "--compact[Role snapshot: compact output]" \
    "--depth[Role snapshot: max depth]" \
    "--selector[Role snapshot: scope to CSS selector]" \
    "--frame[Role snapshot: scope to an iframe selector]" \
    "--labels[Include viewport label overlay screenshot]" \
    "--out[Write snapshot to a file]"
}

_nullclaw_browser_navigate() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_resize() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_click() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]" \
    "--double[Double click]" \
    "--button[Mouse button to use]" \
    "--modifiers[Comma-separated modifiers (Shift,Alt,Meta)]"
}

_nullclaw_browser_type() {
  _arguments -C \
    "--submit[Press Enter after typing]" \
    "--slowly[Type slowly (human-like)]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_press() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_hover() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_scrollintoview() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]" \
    "--timeout-ms[How long to wait for scroll (default: 20000)]"
}

_nullclaw_browser_drag() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_select() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_upload() {
  _arguments -C \
    "--ref[Ref id from snapshot to click after arming]" \
    "--input-ref[Ref id for <input type=file> to set directly]" \
    "--element[CSS selector for <input type=file>]" \
    "--target-id[CDP target id (or unique prefix)]" \
    "--timeout-ms[How long to wait for the next file chooser (default: 120000)]"
}

_nullclaw_browser_waitfordownload() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]" \
    "--timeout-ms[How long to wait for the next download (default: 120000)]"
}

_nullclaw_browser_download() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]" \
    "--timeout-ms[How long to wait for the download to start (default: 120000)]"
}

_nullclaw_browser_dialog() {
  _arguments -C \
    "--accept[Accept the dialog]" \
    "--dismiss[Dismiss the dialog]" \
    "--prompt[Prompt response text]" \
    "--target-id[CDP target id (or unique prefix)]" \
    "--timeout-ms[How long to wait for the next dialog (default: 120000)]"
}

_nullclaw_browser_fill() {
  _arguments -C \
    "--fields[JSON array of field objects]" \
    "--fields-file[Read JSON array from a file]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_wait() {
  _arguments -C \
    "--time[Wait for N milliseconds]" \
    "--text[Wait for text to appear]" \
    "--text-gone[Wait for text to disappear]" \
    "--url[Wait for URL (supports globs like **/dash)]" \
    "--load[Wait for load state]" \
    "--fn[Wait for JS condition (passed to waitForFunction)]" \
    "--timeout-ms[How long to wait for each condition (default: 20000)]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_evaluate() {
  _arguments -C \
    "--fn[Function source, e.g. (el) => el.textContent]" \
    "--ref[Ref from snapshot]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_console() {
  _arguments -C \
    "--level[Filter by level (error, warn, info)]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_pdf() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_responsebody() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]" \
    "--timeout-ms[How long to wait for the response (default: 20000)]" \
    "--max-chars[Max body chars to return (default: 200000)]"
}

_nullclaw_browser_highlight() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_errors() {
  _arguments -C \
    "--clear[Clear stored errors after reading]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_requests() {
  _arguments -C \
    "--filter[Only show URLs that contain this substring]" \
    "--clear[Clear stored requests after reading]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_trace_start() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]" \
    "--no-screenshots[Disable screenshots]" \
    "--no-snapshots[Disable snapshots]" \
    "--sources[Include sources (bigger traces)]"
}

_nullclaw_browser_trace_stop() {
  _arguments -C \
    "--out[Output path within nullclaw temp dir (e.g. trace.zip or /tmp/nullclaw/trace.zip)]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_trace() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'start[Start trace recording]' 'stop[Stop trace recording and write a .zip]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (start) _nullclaw_browser_trace_start ;;
        (stop) _nullclaw_browser_trace_stop ;;
      esac
      ;;
  esac
}

_nullclaw_browser_cookies_set() {
  _arguments -C \
    "--url[Cookie URL scope (recommended)]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_cookies_clear() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_cookies() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]" \
    "1: :_values 'command' 'set[Set a cookie (requires --url or domain+path)]' 'clear[Clear all cookies]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (set) _nullclaw_browser_cookies_set ;;
        (clear) _nullclaw_browser_cookies_clear ;;
      esac
      ;;
  esac
}

_nullclaw_browser_storage_local_get() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_storage_local_set() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_storage_local_clear() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_storage_local() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'get[Get localStorage (all keys or one key)]' 'set[Set a localStorage key]' 'clear[Clear all localStorage keys]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (get) _nullclaw_browser_storage_local_get ;;
        (set) _nullclaw_browser_storage_local_set ;;
        (clear) _nullclaw_browser_storage_local_clear ;;
      esac
      ;;
  esac
}

_nullclaw_browser_storage_session_get() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_storage_session_set() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_storage_session_clear() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_storage_session() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'get[Get sessionStorage (all keys or one key)]' 'set[Set a sessionStorage key]' 'clear[Clear all sessionStorage keys]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (get) _nullclaw_browser_storage_session_get ;;
        (set) _nullclaw_browser_storage_session_set ;;
        (clear) _nullclaw_browser_storage_session_clear ;;
      esac
      ;;
  esac
}

_nullclaw_browser_storage() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'local[localStorage commands]' 'session[sessionStorage commands]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (local) _nullclaw_browser_storage_local ;;
        (session) _nullclaw_browser_storage_session ;;
      esac
      ;;
  esac
}

_nullclaw_browser_set_viewport() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set_offline() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set_headers() {
  _arguments -C \
    "--headers-json[JSON object of headers]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set_credentials() {
  _arguments -C \
    "--clear[Clear credentials]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set_geo() {
  _arguments -C \
    "--clear[Clear geolocation + permissions]" \
    "--accuracy[Accuracy in meters]" \
    "--origin[Origin to grant permissions for]" \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set_media() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set_timezone() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set_locale() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set_device() {
  _arguments -C \
    "--target-id[CDP target id (or unique prefix)]"
}

_nullclaw_browser_set() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'viewport[Set viewport size (alias for resize)]' 'offline[Toggle offline mode]' 'headers[Set extra HTTP headers (JSON object)]' 'credentials[Set HTTP basic auth credentials]' 'geo[Set geolocation (and grant permission)]' 'media[Emulate prefers-color-scheme]' 'timezone[Override timezone (CDP)]' 'locale[Override locale (CDP)]' 'device[Apply a Playwright device descriptor (e.g. "iPhone 14")]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (viewport) _nullclaw_browser_set_viewport ;;
        (offline) _nullclaw_browser_set_offline ;;
        (headers) _nullclaw_browser_set_headers ;;
        (credentials) _nullclaw_browser_set_credentials ;;
        (geo) _nullclaw_browser_set_geo ;;
        (media) _nullclaw_browser_set_media ;;
        (timezone) _nullclaw_browser_set_timezone ;;
        (locale) _nullclaw_browser_set_locale ;;
        (device) _nullclaw_browser_set_device ;;
      esac
      ;;
  esac
}

_nullclaw_browser() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--browser-profile[Browser profile name (default from config)]" \
    "--json[Output machine-readable JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]" \
    "1: :_values 'command' 'status[Show browser status]' 'start[Start the browser (no-op if already running)]' 'stop[Stop the browser (best-effort)]' 'reset-profile[Reset browser profile (moves it to Trash)]' 'tabs[List open tabs]' 'tab[Tab shortcuts (index-based)]' 'open[Open a URL in a new tab]' 'focus[Focus a tab by target id (or unique prefix)]' 'close[Close a tab (target id optional)]' 'profiles[List all browser profiles]' 'create-profile[Create a new browser profile]' 'delete-profile[Delete a browser profile]' 'extension[Chrome extension helpers]' 'screenshot[Capture a screenshot (MEDIA:<path>)]' 'snapshot[Capture a snapshot (default: ai; aria is the accessibility tree)]' 'navigate[Navigate the current tab to a URL]' 'resize[Resize the viewport]' 'click[Click an element by ref from snapshot]' 'type[Type into an element by ref from snapshot]' 'press[Press a key]' 'hover[Hover an element by ai ref]' 'scrollintoview[Scroll an element into view by ref from snapshot]' 'drag[Drag from one ref to another]' 'select[Select option(s) in a select element]' 'upload[Arm file upload for the next file chooser]' 'waitfordownload[Wait for the next download (and save it)]' 'download[Click a ref and save the resulting download]' 'dialog[Arm the next modal dialog (alert/confirm/prompt)]' 'fill[Fill a form with JSON field descriptors]' 'wait[Wait for time, selector, URL, load state, or JS conditions]' 'evaluate[Evaluate a function against the page or a ref]' 'console[Get recent console messages]' 'pdf[Save page as PDF]' 'responsebody[Wait for a network response and return its body]' 'highlight[Highlight an element by ref]' 'errors[Get recent page errors]' 'requests[Get recent network requests (best-effort)]' 'trace[Record a Playwright trace]' 'cookies[Read/write cookies]' 'storage[Read/write localStorage/sessionStorage]' 'set[Browser environment settings]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (status) _nullclaw_browser_status ;;
        (start) _nullclaw_browser_start ;;
        (stop) _nullclaw_browser_stop ;;
        (reset-profile) _nullclaw_browser_reset_profile ;;
        (tabs) _nullclaw_browser_tabs ;;
        (tab) _nullclaw_browser_tab ;;
        (open) _nullclaw_browser_open ;;
        (focus) _nullclaw_browser_focus ;;
        (close) _nullclaw_browser_close ;;
        (profiles) _nullclaw_browser_profiles ;;
        (create-profile) _nullclaw_browser_create_profile ;;
        (delete-profile) _nullclaw_browser_delete_profile ;;
        (extension) _nullclaw_browser_extension ;;
        (screenshot) _nullclaw_browser_screenshot ;;
        (snapshot) _nullclaw_browser_snapshot ;;
        (navigate) _nullclaw_browser_navigate ;;
        (resize) _nullclaw_browser_resize ;;
        (click) _nullclaw_browser_click ;;
        (type) _nullclaw_browser_type ;;
        (press) _nullclaw_browser_press ;;
        (hover) _nullclaw_browser_hover ;;
        (scrollintoview) _nullclaw_browser_scrollintoview ;;
        (drag) _nullclaw_browser_drag ;;
        (select) _nullclaw_browser_select ;;
        (upload) _nullclaw_browser_upload ;;
        (waitfordownload) _nullclaw_browser_waitfordownload ;;
        (download) _nullclaw_browser_download ;;
        (dialog) _nullclaw_browser_dialog ;;
        (fill) _nullclaw_browser_fill ;;
        (wait) _nullclaw_browser_wait ;;
        (evaluate) _nullclaw_browser_evaluate ;;
        (console) _nullclaw_browser_console ;;
        (pdf) _nullclaw_browser_pdf ;;
        (responsebody) _nullclaw_browser_responsebody ;;
        (highlight) _nullclaw_browser_highlight ;;
        (errors) _nullclaw_browser_errors ;;
        (requests) _nullclaw_browser_requests ;;
        (trace) _nullclaw_browser_trace ;;
        (cookies) _nullclaw_browser_cookies ;;
        (storage) _nullclaw_browser_storage ;;
        (set) _nullclaw_browser_set ;;
      esac
      ;;
  esac
}

_nullclaw_acp_client() {
  _arguments -C \
    "--cwd[Working directory for the ACP session]" \
    "--server[ACP server command (default: nullclaw)]" \
    "--server-args[Extra arguments for the ACP server]" \
    "--server-verbose[Enable verbose logging on the ACP server]" \
    "(--verbose -v)"{--verbose,-v}"[Verbose client logging]"
}

_nullclaw_acp() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--token-file[Read gateway token from file]" \
    "--password[Gateway password (if required)]" \
    "--password-file[Read gateway password from file]" \
    "--session[Default session key (e.g. agent:main:main)]" \
    "--session-label[Default session label to resolve]" \
    "--require-existing[Fail if the session key/label does not exist]" \
    "--reset-session[Reset the session key before first use]" \
    "--no-prefix-cwd[Do not prefix prompts with the working directory]" \
    "(--verbose -v)"{--verbose,-v}"[Verbose logging to stderr]" \
    "1: :_values 'command' 'client[Run an interactive ACP client against the local ACP bridge]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (client) _nullclaw_acp_client ;;
      esac
      ;;
  esac
}

_nullclaw_gateway_run() {
  _arguments -C \
    "--port[Port for the gateway WebSocket]" \
    "--bind[Bind mode (\"loopback\"|\"lan\"|\"tailnet\"|\"auto\"|\"custom\"). Defaults to config gateway.bind (or loopback).]" \
    "--token[Shared token required in connect.params.auth.token (default: NULLCLAW_GATEWAY_TOKEN env if set)]" \
    "--auth[Gateway auth mode (\"none\"|\"token\"|\"password\"|\"trusted-proxy\")]" \
    "--password[Password for auth mode=password]" \
    "--tailscale[Tailscale exposure mode (\"off\"|\"serve\"|\"funnel\")]" \
    "--tailscale-reset-on-exit[Reset Tailscale serve/funnel configuration on shutdown]" \
    "--allow-unconfigured[Allow gateway start without gateway.mode=local in config]" \
    "--dev[Create a dev config + workspace if missing (no BOOTSTRAP.md)]" \
    "--reset[Reset dev config + credentials + sessions + workspace (requires --dev)]" \
    "--force[Kill any existing listener on the target port before starting]" \
    "--verbose[Verbose logging to stdout/stderr]" \
    "--claude-cli-logs[Only show claude-cli logs in the console (includes stdout/stderr)]" \
    "--ws-log[WebSocket log style (\"auto\"|\"full\"|\"compact\")]" \
    "--compact[Alias for \"--ws-log compact\"]" \
    "--raw-stream[Log raw model stream events to jsonl]" \
    "--raw-stream-path[Raw stream jsonl path]"
}

_nullclaw_gateway_status() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to config/remote/local)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--no-probe[Skip RPC probe]" \
    "--deep[Scan system-level services]" \
    "--json[Output JSON]"
}

_nullclaw_gateway_install() {
  _arguments -C \
    "--port[Gateway port]" \
    "--runtime[Daemon runtime (node|bun). Default: node]" \
    "--token[Gateway token (token auth)]" \
    "--force[Reinstall/overwrite if already installed]" \
    "--json[Output JSON]"
}

_nullclaw_gateway_uninstall() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_gateway_start() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_gateway_stop() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_gateway_restart() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_gateway_call() {
  _arguments -C \
    "--params[JSON object string for params]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]" \
    "--json[Output JSON]"
}

_nullclaw_gateway_usage_cost() {
  _arguments -C \
    "--days[Number of days to include]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]" \
    "--json[Output JSON]"
}

_nullclaw_gateway_health() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]" \
    "--json[Output JSON]"
}

_nullclaw_gateway_probe() {
  _arguments -C \
    "--url[Explicit Gateway WebSocket URL (still probes localhost)]" \
    "--ssh[SSH target for remote gateway tunnel (user@host or user@host:port)]" \
    "--ssh-identity[SSH identity file path]" \
    "--ssh-auto[Try to derive an SSH target from Bonjour discovery]" \
    "--token[Gateway token (applies to all probes)]" \
    "--password[Gateway password (applies to all probes)]" \
    "--timeout[Overall probe budget in ms]" \
    "--json[Output JSON]"
}

_nullclaw_gateway_discover() {
  _arguments -C \
    "--timeout[Per-command timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_gateway() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--port[Port for the gateway WebSocket]" \
    "--bind[Bind mode (\"loopback\"|\"lan\"|\"tailnet\"|\"auto\"|\"custom\"). Defaults to config gateway.bind (or loopback).]" \
    "--token[Shared token required in connect.params.auth.token (default: NULLCLAW_GATEWAY_TOKEN env if set)]" \
    "--auth[Gateway auth mode (\"none\"|\"token\"|\"password\"|\"trusted-proxy\")]" \
    "--password[Password for auth mode=password]" \
    "--tailscale[Tailscale exposure mode (\"off\"|\"serve\"|\"funnel\")]" \
    "--tailscale-reset-on-exit[Reset Tailscale serve/funnel configuration on shutdown]" \
    "--allow-unconfigured[Allow gateway start without gateway.mode=local in config]" \
    "--dev[Create a dev config + workspace if missing (no BOOTSTRAP.md)]" \
    "--reset[Reset dev config + credentials + sessions + workspace (requires --dev)]" \
    "--force[Kill any existing listener on the target port before starting]" \
    "--verbose[Verbose logging to stdout/stderr]" \
    "--claude-cli-logs[Only show claude-cli logs in the console (includes stdout/stderr)]" \
    "--ws-log[WebSocket log style (\"auto\"|\"full\"|\"compact\")]" \
    "--compact[Alias for \"--ws-log compact\"]" \
    "--raw-stream[Log raw model stream events to jsonl]" \
    "--raw-stream-path[Raw stream jsonl path]" \
    "1: :_values 'command' 'run[Run the WebSocket Gateway (foreground)]' 'status[Show gateway service status + probe the Gateway]' 'install[Install the Gateway service (launchd/systemd/schtasks)]' 'uninstall[Uninstall the Gateway service (launchd/systemd/schtasks)]' 'start[Start the Gateway service (launchd/systemd/schtasks)]' 'stop[Stop the Gateway service (launchd/systemd/schtasks)]' 'restart[Restart the Gateway service (launchd/systemd/schtasks)]' 'call[Call a Gateway method]' 'usage-cost[Fetch usage cost summary from session logs]' 'health[Fetch Gateway health]' 'probe[Show gateway reachability + discovery + health + status summary (local + remote)]' 'discover[Discover gateways via Bonjour (local + wide-area if configured)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (run) _nullclaw_gateway_run ;;
        (status) _nullclaw_gateway_status ;;
        (install) _nullclaw_gateway_install ;;
        (uninstall) _nullclaw_gateway_uninstall ;;
        (start) _nullclaw_gateway_start ;;
        (stop) _nullclaw_gateway_stop ;;
        (restart) _nullclaw_gateway_restart ;;
        (call) _nullclaw_gateway_call ;;
        (usage-cost) _nullclaw_gateway_usage_cost ;;
        (health) _nullclaw_gateway_health ;;
        (probe) _nullclaw_gateway_probe ;;
        (discover) _nullclaw_gateway_discover ;;
      esac
      ;;
  esac
}

_nullclaw_daemon_status() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to config/remote/local)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--no-probe[Skip RPC probe]" \
    "--deep[Scan system-level services]" \
    "--json[Output JSON]"
}

_nullclaw_daemon_install() {
  _arguments -C \
    "--port[Gateway port]" \
    "--runtime[Daemon runtime (node|bun). Default: node]" \
    "--token[Gateway token (token auth)]" \
    "--force[Reinstall/overwrite if already installed]" \
    "--json[Output JSON]"
}

_nullclaw_daemon_uninstall() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_daemon_start() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_daemon_stop() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_daemon_restart() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_daemon() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'status[Show service install status + probe the Gateway]' 'install[Install the Gateway service (launchd/systemd/schtasks)]' 'uninstall[Uninstall the Gateway service (launchd/systemd/schtasks)]' 'start[Start the Gateway service (launchd/systemd/schtasks)]' 'stop[Stop the Gateway service (launchd/systemd/schtasks)]' 'restart[Restart the Gateway service (launchd/systemd/schtasks)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (status) _nullclaw_daemon_status ;;
        (install) _nullclaw_daemon_install ;;
        (uninstall) _nullclaw_daemon_uninstall ;;
        (start) _nullclaw_daemon_start ;;
        (stop) _nullclaw_daemon_stop ;;
        (restart) _nullclaw_daemon_restart ;;
      esac
      ;;
  esac
}

_nullclaw_logs() {
  _arguments -C \
    "--limit[Max lines to return]" \
    "--max-bytes[Max bytes to read]" \
    "--follow[Follow log output]" \
    "--interval[Polling interval in ms]" \
    "--json[Emit JSON log lines]" \
    "--plain[Plain text output (no ANSI styling)]" \
    "--no-color[Disable ANSI colors]" \
    "--local-time[Display timestamps in local timezone]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_system_event() {
  _arguments -C \
    "--text[System event text]" \
    "--mode[Wake mode (now|next-heartbeat)]" \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_system_heartbeat_last() {
  _arguments -C \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_system_heartbeat_enable() {
  _arguments -C \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_system_heartbeat_disable() {
  _arguments -C \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_system_heartbeat() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'last[Show the last heartbeat event]' 'enable[Enable heartbeats]' 'disable[Disable heartbeats]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (last) _nullclaw_system_heartbeat_last ;;
        (enable) _nullclaw_system_heartbeat_enable ;;
        (disable) _nullclaw_system_heartbeat_disable ;;
      esac
      ;;
  esac
}

_nullclaw_system_presence() {
  _arguments -C \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_system() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'event[Enqueue a system event and optionally trigger a heartbeat]' 'heartbeat[Heartbeat controls]' 'presence[List system presence entries]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (event) _nullclaw_system_event ;;
        (heartbeat) _nullclaw_system_heartbeat ;;
        (presence) _nullclaw_system_presence ;;
      esac
      ;;
  esac
}

_nullclaw_models_list() {
  _arguments -C \
    "--all[Show full model catalog]" \
    "--local[Filter to local models]" \
    "--provider[Filter by provider]" \
    "--json[Output JSON]" \
    "--plain[Plain line output]"
}

_nullclaw_models_status() {
  _arguments -C \
    "--json[Output JSON]" \
    "--plain[Plain output]" \
    "--check[Exit non-zero if auth is expiring/expired (1=expired/missing, 2=expiring)]" \
    "--probe[Probe configured provider auth (live)]" \
    "--probe-provider[Only probe a single provider]" \
    "--probe-profile[Only probe specific auth profile ids (repeat or comma-separated)]" \
    "--probe-timeout[Per-probe timeout in ms]" \
    "--probe-concurrency[Concurrent probes]" \
    "--probe-max-tokens[Probe max tokens (best-effort)]" \
    "--agent[Agent id to inspect (overrides NULLCLAW_AGENT_DIR/PI_CODING_AGENT_DIR)]"
}

_nullclaw_models_set() {
  _arguments -C \
    
}

_nullclaw_models_set_image() {
  _arguments -C \
    
}

_nullclaw_models_aliases_list() {
  _arguments -C \
    "--json[Output JSON]" \
    "--plain[Plain output]"
}

_nullclaw_models_aliases_add() {
  _arguments -C \
    
}

_nullclaw_models_aliases_remove() {
  _arguments -C \
    
}

_nullclaw_models_aliases() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List model aliases]' 'add[Add or update a model alias]' 'remove[Remove a model alias]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_models_aliases_list ;;
        (add) _nullclaw_models_aliases_add ;;
        (remove) _nullclaw_models_aliases_remove ;;
      esac
      ;;
  esac
}

_nullclaw_models_fallbacks_list() {
  _arguments -C \
    "--json[Output JSON]" \
    "--plain[Plain output]"
}

_nullclaw_models_fallbacks_add() {
  _arguments -C \
    
}

_nullclaw_models_fallbacks_remove() {
  _arguments -C \
    
}

_nullclaw_models_fallbacks_clear() {
  _arguments -C \
    
}

_nullclaw_models_fallbacks() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List fallback models]' 'add[Add a fallback model]' 'remove[Remove a fallback model]' 'clear[Clear all fallback models]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_models_fallbacks_list ;;
        (add) _nullclaw_models_fallbacks_add ;;
        (remove) _nullclaw_models_fallbacks_remove ;;
        (clear) _nullclaw_models_fallbacks_clear ;;
      esac
      ;;
  esac
}

_nullclaw_models_image_fallbacks_list() {
  _arguments -C \
    "--json[Output JSON]" \
    "--plain[Plain output]"
}

_nullclaw_models_image_fallbacks_add() {
  _arguments -C \
    
}

_nullclaw_models_image_fallbacks_remove() {
  _arguments -C \
    
}

_nullclaw_models_image_fallbacks_clear() {
  _arguments -C \
    
}

_nullclaw_models_image_fallbacks() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List image fallback models]' 'add[Add an image fallback model]' 'remove[Remove an image fallback model]' 'clear[Clear all image fallback models]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_models_image_fallbacks_list ;;
        (add) _nullclaw_models_image_fallbacks_add ;;
        (remove) _nullclaw_models_image_fallbacks_remove ;;
        (clear) _nullclaw_models_image_fallbacks_clear ;;
      esac
      ;;
  esac
}

_nullclaw_models_scan() {
  _arguments -C \
    "--min-params[Minimum parameter size (billions)]" \
    "--max-age-days[Skip models older than N days]" \
    "--provider[Filter by provider prefix]" \
    "--max-candidates[Max fallback candidates]" \
    "--timeout[Per-probe timeout in ms]" \
    "--concurrency[Probe concurrency]" \
    "--no-probe[Skip live probes; list free candidates only]" \
    "--yes[Accept defaults without prompting]" \
    "--no-input[Disable prompts (use defaults)]" \
    "--set-default[Set agents.defaults.model to the first selection]" \
    "--set-image[Set agents.defaults.imageModel to the first image selection]" \
    "--json[Output JSON]"
}

_nullclaw_models_auth_add() {
  _arguments -C \
    
}

_nullclaw_models_auth_login() {
  _arguments -C \
    "--provider[Provider id registered by a plugin]" \
    "--method[Provider auth method id]" \
    "--set-default[Apply the provider'\''s default model recommendation]"
}

_nullclaw_models_auth_setup_token() {
  _arguments -C \
    "--provider[Provider id (default: anthropic)]" \
    "--yes[Skip confirmation]"
}

_nullclaw_models_auth_paste_token() {
  _arguments -C \
    "--provider[Provider id (e.g. anthropic)]" \
    "--profile-id[Auth profile id (default: <provider>:manual)]" \
    "--expires-in[Optional expiry duration (e.g. 365d, 12h). Stored as absolute expiresAt.]"
}

_nullclaw_models_auth_login_github_copilot() {
  _arguments -C \
    "--profile-id[Auth profile id (default: github-copilot:github)]" \
    "--yes[Overwrite existing profile without prompting]"
}

_nullclaw_models_auth_order_get() {
  _arguments -C \
    "--provider[Provider id (e.g. anthropic)]" \
    "--agent[Agent id (default: configured default agent)]" \
    "--json[Output JSON]"
}

_nullclaw_models_auth_order_set() {
  _arguments -C \
    "--provider[Provider id (e.g. anthropic)]" \
    "--agent[Agent id (default: configured default agent)]"
}

_nullclaw_models_auth_order_clear() {
  _arguments -C \
    "--provider[Provider id (e.g. anthropic)]" \
    "--agent[Agent id (default: configured default agent)]"
}

_nullclaw_models_auth_order() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'get[Show per-agent auth order override (from auth-profiles.json)]' 'set[Set per-agent auth order override (locks rotation to this list)]' 'clear[Clear per-agent auth order override (fall back to config/round-robin)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (get) _nullclaw_models_auth_order_get ;;
        (set) _nullclaw_models_auth_order_set ;;
        (clear) _nullclaw_models_auth_order_clear ;;
      esac
      ;;
  esac
}

_nullclaw_models_auth() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--agent[Agent id for auth order get/set/clear]" \
    "1: :_values 'command' 'add[Interactive auth helper (setup-token or paste token)]' 'login[Run a provider plugin auth flow (OAuth/API key)]' 'setup-token[Run a provider CLI to create/sync a token (TTY required)]' 'paste-token[Paste a token into auth-profiles.json and update config]' 'login-github-copilot[Login to GitHub Copilot via GitHub device flow (TTY required)]' 'order[Manage per-agent auth profile order overrides]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (add) _nullclaw_models_auth_add ;;
        (login) _nullclaw_models_auth_login ;;
        (setup-token) _nullclaw_models_auth_setup_token ;;
        (paste-token) _nullclaw_models_auth_paste_token ;;
        (login-github-copilot) _nullclaw_models_auth_login_github_copilot ;;
        (order) _nullclaw_models_auth_order ;;
      esac
      ;;
  esac
}

_nullclaw_models() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--status-json[Output JSON (alias for `models status --json`)]" \
    "--status-plain[Plain output (alias for `models status --plain`)]" \
    "--agent[Agent id to inspect (overrides NULLCLAW_AGENT_DIR/PI_CODING_AGENT_DIR)]" \
    "1: :_values 'command' 'list[List models (configured by default)]' 'status[Show configured model state]' 'set[Set the default model]' 'set-image[Set the image model]' 'aliases[Manage model aliases]' 'fallbacks[Manage model fallback list]' 'image-fallbacks[Manage image model fallback list]' 'scan[Scan OpenRouter free models for tools + images]' 'auth[Manage model auth profiles]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_models_list ;;
        (status) _nullclaw_models_status ;;
        (set) _nullclaw_models_set ;;
        (set-image) _nullclaw_models_set_image ;;
        (aliases) _nullclaw_models_aliases ;;
        (fallbacks) _nullclaw_models_fallbacks ;;
        (image-fallbacks) _nullclaw_models_image_fallbacks ;;
        (scan) _nullclaw_models_scan ;;
        (auth) _nullclaw_models_auth ;;
      esac
      ;;
  esac
}

_nullclaw_approvals_get() {
  _arguments -C \
    "--node[Target node id/name/IP]" \
    "--gateway[Force gateway approvals]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_approvals_set() {
  _arguments -C \
    "--node[Target node id/name/IP]" \
    "--gateway[Force gateway approvals]" \
    "--file[Path to JSON file to upload]" \
    "--stdin[Read JSON from stdin]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_approvals_allowlist_add() {
  _arguments -C \
    "--node[Target node id/name/IP]" \
    "--gateway[Force gateway approvals]" \
    "--agent[Agent id (defaults to \"*\")]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_approvals_allowlist_remove() {
  _arguments -C \
    "--node[Target node id/name/IP]" \
    "--gateway[Force gateway approvals]" \
    "--agent[Agent id (defaults to \"*\")]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_approvals_allowlist() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'add[Add a glob pattern to an allowlist]' 'remove[Remove a glob pattern from an allowlist]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (add) _nullclaw_approvals_allowlist_add ;;
        (remove) _nullclaw_approvals_allowlist_remove ;;
      esac
      ;;
  esac
}

_nullclaw_approvals() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'get[Fetch exec approvals snapshot]' 'set[Replace exec approvals with a JSON file]' 'allowlist[Edit the per-agent allowlist]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (get) _nullclaw_approvals_get ;;
        (set) _nullclaw_approvals_set ;;
        (allowlist) _nullclaw_approvals_allowlist ;;
      esac
      ;;
  esac
}

_nullclaw_nodes_status() {
  _arguments -C \
    "--connected[Only show connected nodes]" \
    "--last-connected[Only show nodes connected within duration (e.g. 24h)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_describe() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_list() {
  _arguments -C \
    "--connected[Only show connected nodes]" \
    "--last-connected[Only show nodes connected within duration (e.g. 24h)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_pending() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_approve() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_reject() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_rename() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--name[New display name]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_invoke() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--command[Command (e.g. canvas.eval)]" \
    "--params[JSON object string for params]" \
    "--invoke-timeout[Node invoke timeout in ms (default 15000)]" \
    "--idempotency-key[Idempotency key (optional)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_run() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--cwd[Working directory]" \
    "--env[Environment override (repeatable)]" \
    "--raw[Run a raw shell command string (sh -lc / cmd.exe /c)]" \
    "--agent[Agent id (default: configured default agent)]" \
    "--ask[Exec ask mode (off|on-miss|always)]" \
    "--security[Exec security mode (deny|allowlist|full)]" \
    "--command-timeout[Command timeout (ms)]" \
    "--needs-screen-recording[Require screen recording permission]" \
    "--invoke-timeout[Node invoke timeout in ms (default 30000)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_notify() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--title[Notification title]" \
    "--body[Notification body]" \
    "--sound[Notification sound]" \
    "--priority[Notification priority]" \
    "--delivery[Delivery mode]" \
    "--invoke-timeout[Node invoke timeout in ms (default 15000)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_push() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--title[Push title]" \
    "--body[Push body]" \
    "--environment[Override APNs environment]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_canvas_snapshot() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--format[Image format]" \
    "--max-width[Max width in px (optional)]" \
    "--quality[JPEG quality (optional)]" \
    "--invoke-timeout[Node invoke timeout in ms (default 20000)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_canvas_present() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--target[Target URL/path (optional)]" \
    "--x[Placement x coordinate]" \
    "--y[Placement y coordinate]" \
    "--width[Placement width]" \
    "--height[Placement height]" \
    "--invoke-timeout[Node invoke timeout in ms]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_canvas_hide() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--invoke-timeout[Node invoke timeout in ms]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_canvas_navigate() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--invoke-timeout[Node invoke timeout in ms]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_canvas_eval() {
  _arguments -C \
    "--js[JavaScript to evaluate]" \
    "--node[Node id, name, or IP]" \
    "--invoke-timeout[Node invoke timeout in ms]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_canvas_a2ui_push() {
  _arguments -C \
    "--jsonl[Path to JSONL payload]" \
    "--text[Render a quick A2UI text payload]" \
    "--node[Node id, name, or IP]" \
    "--invoke-timeout[Node invoke timeout in ms]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_canvas_a2ui_reset() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--invoke-timeout[Node invoke timeout in ms]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_canvas_a2ui() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'push[Push A2UI JSONL to the canvas]' 'reset[Reset A2UI renderer state]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (push) _nullclaw_nodes_canvas_a2ui_push ;;
        (reset) _nullclaw_nodes_canvas_a2ui_reset ;;
      esac
      ;;
  esac
}

_nullclaw_nodes_canvas() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'snapshot[Capture a canvas snapshot (prints MEDIA:<path>)]' 'present[Show the canvas (optionally with a target URL/path)]' 'hide[Hide the canvas]' 'navigate[Navigate the canvas to a URL]' 'eval[Evaluate JavaScript in the canvas]' 'a2ui[Render A2UI content on the canvas]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (snapshot) _nullclaw_nodes_canvas_snapshot ;;
        (present) _nullclaw_nodes_canvas_present ;;
        (hide) _nullclaw_nodes_canvas_hide ;;
        (navigate) _nullclaw_nodes_canvas_navigate ;;
        (eval) _nullclaw_nodes_canvas_eval ;;
        (a2ui) _nullclaw_nodes_canvas_a2ui ;;
      esac
      ;;
  esac
}

_nullclaw_nodes_camera_list() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_camera_snap() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--facing[Camera facing]" \
    "--device-id[Camera device id (from nodes camera list)]" \
    "--max-width[Max width in px (optional)]" \
    "--quality[JPEG quality (default 0.9)]" \
    "--delay-ms[Delay before capture in ms (macOS default 2000)]" \
    "--invoke-timeout[Node invoke timeout in ms (default 20000)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_camera_clip() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--facing[Camera facing]" \
    "--device-id[Camera device id (from nodes camera list)]" \
    "--duration[Duration (default 3000ms; supports ms/s/m, e.g. 10s)]" \
    "--no-audio[Disable audio capture]" \
    "--invoke-timeout[Node invoke timeout in ms (default 90000)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_camera() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List available cameras on a node]' 'snap[Capture a photo from a node camera (prints MEDIA:<path>)]' 'clip[Capture a short video clip from a node camera (prints MEDIA:<path>)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_nodes_camera_list ;;
        (snap) _nullclaw_nodes_camera_snap ;;
        (clip) _nullclaw_nodes_camera_clip ;;
      esac
      ;;
  esac
}

_nullclaw_nodes_screen_record() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--screen[Screen index (0 = primary)]" \
    "--duration[Clip duration (ms or 10s)]" \
    "--fps[Frames per second]" \
    "--no-audio[Disable microphone audio capture]" \
    "--out[Output path]" \
    "--invoke-timeout[Node invoke timeout in ms (default 120000)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_screen() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'record[Capture a short screen recording from a node (prints MEDIA:<path>)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (record) _nullclaw_nodes_screen_record ;;
      esac
      ;;
  esac
}

_nullclaw_nodes_location_get() {
  _arguments -C \
    "--node[Node id, name, or IP]" \
    "--max-age[Use cached location newer than this (ms)]" \
    "--accuracy[Desired accuracy (default: balanced/precise depending on node setting)]" \
    "--location-timeout[Location fix timeout (ms)]" \
    "--invoke-timeout[Node invoke timeout in ms (default 20000)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_nodes_location() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'get[Fetch the current location from a node]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (get) _nullclaw_nodes_location_get ;;
      esac
      ;;
  esac
}

_nullclaw_nodes() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'status[List known nodes with connection status and capabilities]' 'describe[Describe a node (capabilities + supported invoke commands)]' 'list[List pending and paired nodes]' 'pending[List pending pairing requests]' 'approve[Approve a pending pairing request]' 'reject[Reject a pending pairing request]' 'rename[Rename a paired node (display name override)]' 'invoke[Invoke a command on a paired node]' 'run[Run a shell command on a node (mac only)]' 'notify[Send a local notification on a node (mac only)]' 'push[Send an APNs test push to an iOS node]' 'canvas[Capture or render canvas content from a paired node]' 'camera[Capture camera media from a paired node]' 'screen[Capture screen recordings from a paired node]' 'location[Fetch location from a paired node]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (status) _nullclaw_nodes_status ;;
        (describe) _nullclaw_nodes_describe ;;
        (list) _nullclaw_nodes_list ;;
        (pending) _nullclaw_nodes_pending ;;
        (approve) _nullclaw_nodes_approve ;;
        (reject) _nullclaw_nodes_reject ;;
        (rename) _nullclaw_nodes_rename ;;
        (invoke) _nullclaw_nodes_invoke ;;
        (run) _nullclaw_nodes_run ;;
        (notify) _nullclaw_nodes_notify ;;
        (push) _nullclaw_nodes_push ;;
        (canvas) _nullclaw_nodes_canvas ;;
        (camera) _nullclaw_nodes_camera ;;
        (screen) _nullclaw_nodes_screen ;;
        (location) _nullclaw_nodes_location ;;
      esac
      ;;
  esac
}

_nullclaw_devices_list() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_devices_remove() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_devices_clear() {
  _arguments -C \
    "--pending[Also reject all pending pairing requests]" \
    "--yes[Confirm destructive clear]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_devices_approve() {
  _arguments -C \
    "--latest[Approve the most recent pending request]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_devices_reject() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_devices_rotate() {
  _arguments -C \
    "--device[Device id]" \
    "--role[Role name]" \
    "--scope[Scopes to attach to the token (repeatable)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_devices_revoke() {
  _arguments -C \
    "--device[Device id]" \
    "--role[Role name]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (password auth)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_devices() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List pending and paired devices]' 'remove[Remove a paired device entry]' 'clear[Clear paired devices from the gateway table]' 'approve[Approve a pending device pairing request]' 'reject[Reject a pending device pairing request]' 'rotate[Rotate a device token for a role]' 'revoke[Revoke a device token for a role]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_devices_list ;;
        (remove) _nullclaw_devices_remove ;;
        (clear) _nullclaw_devices_clear ;;
        (approve) _nullclaw_devices_approve ;;
        (reject) _nullclaw_devices_reject ;;
        (rotate) _nullclaw_devices_rotate ;;
        (revoke) _nullclaw_devices_revoke ;;
      esac
      ;;
  esac
}

_nullclaw_node_run() {
  _arguments -C \
    "--host[Gateway host]" \
    "--port[Gateway port]" \
    "--tls[Use TLS for the gateway connection]" \
    "--tls-fingerprint[Expected TLS certificate fingerprint (sha256)]" \
    "--node-id[Override node id (clears pairing token)]" \
    "--display-name[Override node display name]"
}

_nullclaw_node_status() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_node_install() {
  _arguments -C \
    "--host[Gateway host]" \
    "--port[Gateway port]" \
    "--tls[Use TLS for the gateway connection]" \
    "--tls-fingerprint[Expected TLS certificate fingerprint (sha256)]" \
    "--node-id[Override node id (clears pairing token)]" \
    "--display-name[Override node display name]" \
    "--runtime[Service runtime (node|bun). Default: node]" \
    "--force[Reinstall/overwrite if already installed]" \
    "--json[Output JSON]"
}

_nullclaw_node_uninstall() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_node_stop() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_node_restart() {
  _arguments -C \
    "--json[Output JSON]"
}

_nullclaw_node() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'run[Run the headless node host (foreground)]' 'status[Show node host status]' 'install[Install the node host service (launchd/systemd/schtasks)]' 'uninstall[Uninstall the node host service (launchd/systemd/schtasks)]' 'stop[Stop the node host service (launchd/systemd/schtasks)]' 'restart[Restart the node host service (launchd/systemd/schtasks)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (run) _nullclaw_node_run ;;
        (status) _nullclaw_node_status ;;
        (install) _nullclaw_node_install ;;
        (uninstall) _nullclaw_node_uninstall ;;
        (stop) _nullclaw_node_stop ;;
        (restart) _nullclaw_node_restart ;;
      esac
      ;;
  esac
}

_nullclaw_sandbox_list() {
  _arguments -C \
    "--json[Output result as JSON]" \
    "--browser[List browser containers only]"
}

_nullclaw_sandbox_recreate() {
  _arguments -C \
    "--all[Recreate all sandbox containers]" \
    "--session[Recreate container for specific session]" \
    "--agent[Recreate containers for specific agent]" \
    "--browser[Only recreate browser containers]" \
    "--force[Skip confirmation prompt]"
}

_nullclaw_sandbox_explain() {
  _arguments -C \
    "--session[Session key to inspect (defaults to agent main)]" \
    "--agent[Agent id to inspect (defaults to derived agent)]" \
    "--json[Output result as JSON]"
}

_nullclaw_sandbox() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List sandbox containers and their status]' 'recreate[Remove containers to force recreation with updated config]' 'explain[Explain effective sandbox/tool policy for a session/agent]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_sandbox_list ;;
        (recreate) _nullclaw_sandbox_recreate ;;
        (explain) _nullclaw_sandbox_explain ;;
      esac
      ;;
  esac
}

_nullclaw_tui() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--password[Gateway password (if required)]" \
    "--session[Session key (default: \"main\", or \"global\" when scope is global)]" \
    "--deliver[Deliver assistant replies]" \
    "--thinking[Thinking level override]" \
    "--message[Send an initial message after connecting]" \
    "--timeout-ms[Agent timeout in ms (defaults to agents.defaults.timeoutSeconds)]" \
    "--history-limit[History entries to load]"
}

_nullclaw_cron_status() {
  _arguments -C \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron_list() {
  _arguments -C \
    "--all[Include disabled jobs]" \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron_add() {
  _arguments -C \
    "--name[Job name]" \
    "--description[Optional description]" \
    "--disabled[Create job disabled]" \
    "--delete-after-run[Delete one-shot job after it succeeds]" \
    "--keep-after-run[Keep one-shot job after it succeeds]" \
    "--agent[Agent id for this job]" \
    "--session[Session target (main|isolated)]" \
    "--session-key[Session key for job routing (e.g. agent:my-agent:my-session)]" \
    "--wake[Wake mode (now|next-heartbeat)]" \
    "--at[Run once at time (ISO) or +duration (e.g. 20m)]" \
    "--every[Run every duration (e.g. 10m, 1h)]" \
    "--cron[Cron expression (5-field or 6-field with seconds)]" \
    "--tz[Timezone for cron expressions (IANA)]" \
    "--stagger[Cron stagger window (e.g. 30s, 5m)]" \
    "--exact[Disable cron staggering (set stagger to 0)]" \
    "--system-event[System event payload (main session)]" \
    "--message[Agent message payload]" \
    "--thinking[Thinking level for agent jobs (off|minimal|low|medium|high)]" \
    "--model[Model override for agent jobs (provider/model or alias)]" \
    "--timeout-seconds[Timeout seconds for agent jobs]" \
    "--announce[Announce summary to a chat (subagent-style)]" \
    "--deliver[Deprecated (use --announce). Announces a summary to a chat.]" \
    "--no-deliver[Disable announce delivery and skip main-session summary]" \
    "--channel[Delivery channel (last)]" \
    "--to[Delivery destination (E.164, Telegram chatId, or Discord channel/user)]" \
    "--best-effort-deliver[Do not fail the job if delivery fails]" \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron_rm() {
  _arguments -C \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron_enable() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron_disable() {
  _arguments -C \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron_runs() {
  _arguments -C \
    "--id[Job id]" \
    "--limit[Max entries (default 50)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron_run() {
  _arguments -C \
    "--due[Run only when due (default behavior in older versions)]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron_edit() {
  _arguments -C \
    "--name[Set name]" \
    "--description[Set description]" \
    "--enable[Enable job]" \
    "--disable[Disable job]" \
    "--delete-after-run[Delete one-shot job after it succeeds]" \
    "--keep-after-run[Keep one-shot job after it succeeds]" \
    "--session[Session target (main|isolated)]" \
    "--agent[Set agent id]" \
    "--clear-agent[Unset agent and use default]" \
    "--session-key[Set session key for job routing]" \
    "--clear-session-key[Unset session key]" \
    "--wake[Wake mode (now|next-heartbeat)]" \
    "--at[Set one-shot time (ISO) or duration like 20m]" \
    "--every[Set interval duration like 10m]" \
    "--cron[Set cron expression]" \
    "--tz[Timezone for cron expressions (IANA)]" \
    "--stagger[Cron stagger window (e.g. 30s, 5m)]" \
    "--exact[Disable cron staggering (set stagger to 0)]" \
    "--system-event[Set systemEvent payload]" \
    "--message[Set agentTurn payload message]" \
    "--thinking[Thinking level for agent jobs]" \
    "--model[Model override for agent jobs]" \
    "--timeout-seconds[Timeout seconds for agent jobs]" \
    "--announce[Announce summary to a chat (subagent-style)]" \
    "--deliver[Deprecated (use --announce). Announces a summary to a chat.]" \
    "--no-deliver[Disable announce delivery]" \
    "--channel[Delivery channel (last)]" \
    "--to[Delivery destination (E.164, Telegram chatId, or Discord channel/user)]" \
    "--best-effort-deliver[Do not fail job if delivery fails]" \
    "--no-best-effort-deliver[Fail job when delivery fails]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_cron() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'status[Show cron scheduler status]' 'list[List cron jobs]' 'add[Add a cron job]' 'rm[Remove a cron job]' 'enable[Enable a cron job]' 'disable[Disable a cron job]' 'runs[Show cron run history (JSONL-backed)]' 'run[Run a cron job now (debug)]' 'edit[Edit a cron job (patch fields)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (status) _nullclaw_cron_status ;;
        (list) _nullclaw_cron_list ;;
        (add) _nullclaw_cron_add ;;
        (rm) _nullclaw_cron_rm ;;
        (enable) _nullclaw_cron_enable ;;
        (disable) _nullclaw_cron_disable ;;
        (runs) _nullclaw_cron_runs ;;
        (run) _nullclaw_cron_run ;;
        (edit) _nullclaw_cron_edit ;;
      esac
      ;;
  esac
}

_nullclaw_dns_setup() {
  _arguments -C \
    "--domain[Wide-area discovery domain (e.g. nullclaw.internal)]" \
    "--apply[Install/update CoreDNS config and (re)start the service (requires sudo)]"
}

_nullclaw_dns() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'setup[Set up CoreDNS to serve your discovery domain for unicast DNS-SD (Wide-Area Bonjour)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (setup) _nullclaw_dns_setup ;;
      esac
      ;;
  esac
}

_nullclaw_docs() {
  _arguments -C \
    
}

_nullclaw_hooks_list() {
  _arguments -C \
    "--eligible[Show only eligible hooks]" \
    "--json[Output as JSON]" \
    "(--verbose -v)"{--verbose,-v}"[Show more details including missing requirements]"
}

_nullclaw_hooks_info() {
  _arguments -C \
    "--json[Output as JSON]"
}

_nullclaw_hooks_check() {
  _arguments -C \
    "--json[Output as JSON]"
}

_nullclaw_hooks_enable() {
  _arguments -C \
    
}

_nullclaw_hooks_disable() {
  _arguments -C \
    
}

_nullclaw_hooks_install() {
  _arguments -C \
    "(--link -l)"{--link,-l}"[Link a local path instead of copying]" \
    "--pin[Record npm installs as exact resolved <name>@<version>]"
}

_nullclaw_hooks_update() {
  _arguments -C \
    "--all[Update all tracked hooks]" \
    "--dry-run[Show what would change without writing]"
}

_nullclaw_hooks() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List all hooks]' 'info[Show detailed information about a hook]' 'check[Check hooks eligibility status]' 'enable[Enable a hook]' 'disable[Disable a hook]' 'install[Install a hook pack (path, archive, or npm spec)]' 'update[Update installed hooks (npm installs only)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_hooks_list ;;
        (info) _nullclaw_hooks_info ;;
        (check) _nullclaw_hooks_check ;;
        (enable) _nullclaw_hooks_enable ;;
        (disable) _nullclaw_hooks_disable ;;
        (install) _nullclaw_hooks_install ;;
        (update) _nullclaw_hooks_update ;;
      esac
      ;;
  esac
}

_nullclaw_webhooks_gmail_setup() {
  _arguments -C \
    "--account[Gmail account to watch]" \
    "--project[GCP project id (OAuth client owner)]" \
    "--topic[Pub/Sub topic name]" \
    "--subscription[Pub/Sub subscription name]" \
    "--label[Gmail label to watch]" \
    "--hook-url[NullClaw hook URL]" \
    "--hook-token[NullClaw hook token]" \
    "--push-token[Push token for gog watch serve]" \
    "--bind[gog watch serve bind host]" \
    "--port[gog watch serve port]" \
    "--path[gog watch serve path]" \
    "--include-body[Include email body snippets]" \
    "--max-bytes[Max bytes for body snippets]" \
    "--renew-minutes[Renew watch every N minutes]" \
    "--tailscale[Expose push endpoint via tailscale (funnel|serve|off)]" \
    "--tailscale-path[Path for tailscale serve/funnel]" \
    "--tailscale-target[Tailscale serve/funnel target (port, host:port, or URL)]" \
    "--push-endpoint[Explicit Pub/Sub push endpoint]" \
    "--json[Output JSON summary]"
}

_nullclaw_webhooks_gmail_run() {
  _arguments -C \
    "--account[Gmail account to watch]" \
    "--topic[Pub/Sub topic path (projects/.../topics/..)]" \
    "--subscription[Pub/Sub subscription name]" \
    "--label[Gmail label to watch]" \
    "--hook-url[NullClaw hook URL]" \
    "--hook-token[NullClaw hook token]" \
    "--push-token[Push token for gog watch serve]" \
    "--bind[gog watch serve bind host]" \
    "--port[gog watch serve port]" \
    "--path[gog watch serve path]" \
    "--include-body[Include email body snippets]" \
    "--max-bytes[Max bytes for body snippets]" \
    "--renew-minutes[Renew watch every N minutes]" \
    "--tailscale[Expose push endpoint via tailscale (funnel|serve|off)]" \
    "--tailscale-path[Path for tailscale serve/funnel]" \
    "--tailscale-target[Tailscale serve/funnel target (port, host:port, or URL)]"
}

_nullclaw_webhooks_gmail() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'setup[Configure Gmail watch + Pub/Sub + NullClaw hooks]' 'run[Run gog watch serve + auto-renew loop]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (setup) _nullclaw_webhooks_gmail_setup ;;
        (run) _nullclaw_webhooks_gmail_run ;;
      esac
      ;;
  esac
}

_nullclaw_webhooks() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'gmail[Gmail Pub/Sub hooks (via gogcli)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (gmail) _nullclaw_webhooks_gmail ;;
      esac
      ;;
  esac
}

_nullclaw_qr() {
  _arguments -C \
    "--remote[Use gateway.remote.url and gateway.remote token/password (ignores device-pair publicUrl)]" \
    "--url[Override gateway URL used in the setup payload]" \
    "--public-url[Override gateway public URL used in the setup payload]" \
    "--token[Override gateway token for setup payload]" \
    "--password[Override gateway password for setup payload]" \
    "--setup-code-only[Print only the setup code]" \
    "--no-ascii[Skip ASCII QR rendering]" \
    "--json[Output JSON]"
}

_nullclaw_clawbot_qr() {
  _arguments -C \
    "--remote[Use gateway.remote.url and gateway.remote token/password (ignores device-pair publicUrl)]" \
    "--url[Override gateway URL used in the setup payload]" \
    "--public-url[Override gateway public URL used in the setup payload]" \
    "--token[Override gateway token for setup payload]" \
    "--password[Override gateway password for setup payload]" \
    "--setup-code-only[Print only the setup code]" \
    "--no-ascii[Skip ASCII QR rendering]" \
    "--json[Output JSON]"
}

_nullclaw_clawbot() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'qr[Generate an iOS pairing QR code and setup code]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (qr) _nullclaw_clawbot_qr ;;
      esac
      ;;
  esac
}

_nullclaw_pairing_list() {
  _arguments -C \
    "--channel[Channel (telegram)]" \
    "--account[Account id (for multi-account channels)]" \
    "--json[Print JSON]"
}

_nullclaw_pairing_approve() {
  _arguments -C \
    "--channel[Channel (telegram)]" \
    "--account[Account id (for multi-account channels)]" \
    "--notify[Notify the requester on the same channel]"
}

_nullclaw_pairing() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List pending pairing requests]' 'approve[Approve a pairing code and allow that sender]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_pairing_list ;;
        (approve) _nullclaw_pairing_approve ;;
      esac
      ;;
  esac
}

_nullclaw_plugins_list() {
  _arguments -C \
    "--json[Print JSON]" \
    "--enabled[Only show enabled plugins]" \
    "--verbose[Show detailed entries]"
}

_nullclaw_plugins_info() {
  _arguments -C \
    "--json[Print JSON]"
}

_nullclaw_plugins_enable() {
  _arguments -C \
    
}

_nullclaw_plugins_disable() {
  _arguments -C \
    
}

_nullclaw_plugins_uninstall() {
  _arguments -C \
    "--keep-files[Keep installed files on disk]" \
    "--keep-config[Deprecated alias for --keep-files]" \
    "--force[Skip confirmation prompt]" \
    "--dry-run[Show what would be removed without making changes]"
}

_nullclaw_plugins_install() {
  _arguments -C \
    "(--link -l)"{--link,-l}"[Link a local path instead of copying]" \
    "--pin[Record npm installs as exact resolved <name>@<version>]"
}

_nullclaw_plugins_update() {
  _arguments -C \
    "--all[Update all tracked plugins]" \
    "--dry-run[Show what would change without writing]"
}

_nullclaw_plugins_doctor() {
  _arguments -C \
    
}

_nullclaw_plugins() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List discovered plugins]' 'info[Show plugin details]' 'enable[Enable a plugin in config]' 'disable[Disable a plugin in config]' 'uninstall[Uninstall a plugin]' 'install[Install a plugin (path, archive, or npm spec)]' 'update[Update installed plugins (npm installs only)]' 'doctor[Report plugin load issues]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_plugins_list ;;
        (info) _nullclaw_plugins_info ;;
        (enable) _nullclaw_plugins_enable ;;
        (disable) _nullclaw_plugins_disable ;;
        (uninstall) _nullclaw_plugins_uninstall ;;
        (install) _nullclaw_plugins_install ;;
        (update) _nullclaw_plugins_update ;;
        (doctor) _nullclaw_plugins_doctor ;;
      esac
      ;;
  esac
}

_nullclaw_channels_list() {
  _arguments -C \
    "--no-usage[Skip model provider usage/quota snapshots]" \
    "--json[Output JSON]"
}

_nullclaw_channels_status() {
  _arguments -C \
    "--probe[Probe channel credentials]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_channels_capabilities() {
  _arguments -C \
    "--channel[Channel (all|telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon)]" \
    "--account[Account id (only with --channel)]" \
    "--target[Channel target for permission audit (Discord channel:<id>)]" \
    "--timeout[Timeout in ms]" \
    "--json[Output JSON]"
}

_nullclaw_channels_resolve() {
  _arguments -C \
    "--channel[Channel (telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon)]" \
    "--account[Account id (accountId)]" \
    "--kind[Target kind (auto|user|group)]" \
    "--json[Output JSON]"
}

_nullclaw_channels_logs() {
  _arguments -C \
    "--channel[Channel (all|telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon)]" \
    "--lines[Number of lines (default: 200)]" \
    "--json[Output JSON]"
}

_nullclaw_channels_add() {
  _arguments -C \
    "--channel[Channel (telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon)]" \
    "--account[Account id (default when omitted)]" \
    "--name[Display name for this account]" \
    "--token[Bot token (Telegram/Discord)]" \
    "--token-file[Bot token file (Telegram)]" \
    "--bot-token[Slack bot token (xoxb-...)]" \
    "--app-token[Slack app token (xapp-...)]" \
    "--signal-number[Signal account number (E.164)]" \
    "--cli-path[CLI path (signal-cli or imsg)]" \
    "--db-path[iMessage database path]" \
    "--service[iMessage service (imessage|sms|auto)]" \
    "--region[iMessage region (for SMS)]" \
    "--auth-dir[WhatsApp auth directory override]" \
    "--http-url[Signal HTTP daemon base URL]" \
    "--http-host[Signal HTTP host]" \
    "--http-port[Signal HTTP port]" \
    "--webhook-path[Webhook path (Google Chat/BlueBubbles)]" \
    "--webhook-url[Google Chat webhook URL]" \
    "--audience-type[Google Chat audience type (app-url|project-number)]" \
    "--audience[Google Chat audience value (app URL or project number)]" \
    "--homeserver[Matrix homeserver URL]" \
    "--user-id[Matrix user ID]" \
    "--access-token[Matrix access token]" \
    "--password[Matrix password]" \
    "--device-name[Matrix device name]" \
    "--initial-sync-limit[Matrix initial sync limit]" \
    "--ship[Tlon ship name (~sampel-palnet)]" \
    "--url[Tlon ship URL]" \
    "--code[Tlon login code]" \
    "--group-channels[Tlon group channels (comma-separated)]" \
    "--dm-allowlist[Tlon DM allowlist (comma-separated ships)]" \
    "--auto-discover-channels[Tlon auto-discover group channels]" \
    "--no-auto-discover-channels[Disable Tlon auto-discovery]" \
    "--use-env[Use env token (default account only)]"
}

_nullclaw_channels_remove() {
  _arguments -C \
    "--channel[Channel (telegram|whatsapp|discord|irc|googlechat|slack|signal|imessage|feishu|nostr|msteams|mattermost|nextcloud-talk|matrix|bluebubbles|line|zalo|zalouser|synology-chat|tlon)]" \
    "--account[Account id (default when omitted)]" \
    "--delete[Delete config entries (no prompt)]"
}

_nullclaw_channels_login() {
  _arguments -C \
    "--channel[Channel alias (auto when only one is configured)]" \
    "--account[Account id (accountId)]" \
    "--verbose[Verbose connection logs]"
}

_nullclaw_channels_logout() {
  _arguments -C \
    "--channel[Channel alias (auto when only one is configured)]" \
    "--account[Account id (accountId)]"
}

_nullclaw_channels() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List configured channels + auth profiles]' 'status[Show gateway channel status (use status --deep for local)]' 'capabilities[Show provider capabilities (intents/scopes + supported features)]' 'resolve[Resolve channel/user names to IDs]' 'logs[Show recent channel logs from the gateway log file]' 'add[Add or update a channel account]' 'remove[Disable or delete a channel account]' 'login[Link a channel account (if supported)]' 'logout[Log out of a channel session (if supported)]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_channels_list ;;
        (status) _nullclaw_channels_status ;;
        (capabilities) _nullclaw_channels_capabilities ;;
        (resolve) _nullclaw_channels_resolve ;;
        (logs) _nullclaw_channels_logs ;;
        (add) _nullclaw_channels_add ;;
        (remove) _nullclaw_channels_remove ;;
        (login) _nullclaw_channels_login ;;
        (logout) _nullclaw_channels_logout ;;
      esac
      ;;
  esac
}

_nullclaw_directory_self() {
  _arguments -C \
    "--channel[Channel (auto when only one is configured)]" \
    "--account[Account id (accountId)]" \
    "--json[Output JSON]"
}

_nullclaw_directory_peers_list() {
  _arguments -C \
    "--channel[Channel (auto when only one is configured)]" \
    "--account[Account id (accountId)]" \
    "--json[Output JSON]" \
    "--query[Optional search query]" \
    "--limit[Limit results]"
}

_nullclaw_directory_peers() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List peers]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_directory_peers_list ;;
      esac
      ;;
  esac
}

_nullclaw_directory_groups_list() {
  _arguments -C \
    "--channel[Channel (auto when only one is configured)]" \
    "--account[Account id (accountId)]" \
    "--json[Output JSON]" \
    "--query[Optional search query]" \
    "--limit[Limit results]"
}

_nullclaw_directory_groups_members() {
  _arguments -C \
    "--group-id[Group id]" \
    "--channel[Channel (auto when only one is configured)]" \
    "--account[Account id (accountId)]" \
    "--json[Output JSON]" \
    "--limit[Limit results]"
}

_nullclaw_directory_groups() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List groups]' 'members[List group members]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_directory_groups_list ;;
        (members) _nullclaw_directory_groups_members ;;
      esac
      ;;
  esac
}

_nullclaw_directory() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'self[Show the current account user]' 'peers[Peer directory (contacts/users)]' 'groups[Group directory]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (self) _nullclaw_directory_self ;;
        (peers) _nullclaw_directory_peers ;;
        (groups) _nullclaw_directory_groups ;;
      esac
      ;;
  esac
}

_nullclaw_security_audit() {
  _arguments -C \
    "--deep[Attempt live Gateway probe (best-effort)]" \
    "--fix[Apply safe fixes (tighten defaults + chmod state/config)]" \
    "--json[Print JSON]"
}

_nullclaw_security() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'audit[Audit config + local state for common security foot-guns]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (audit) _nullclaw_security_audit ;;
      esac
      ;;
  esac
}

_nullclaw_secrets_reload() {
  _arguments -C \
    "--json[Output JSON]" \
    "--url[Gateway WebSocket URL (defaults to gateway.remote.url when configured)]" \
    "--token[Gateway token (if required)]" \
    "--timeout[Timeout in ms]" \
    "--expect-final[Wait for final response (agent)]"
}

_nullclaw_secrets_audit() {
  _arguments -C \
    "--check[Exit non-zero when findings are present]" \
    "--json[Output JSON]"
}

_nullclaw_secrets_configure() {
  _arguments -C \
    "--apply[Apply changes immediately after preflight]" \
    "--yes[Skip apply confirmation prompt]" \
    "--providers-only[Configure secrets.providers only, skip credential mapping]" \
    "--skip-provider-setup[Skip provider setup and only map credential fields to existing providers]" \
    "--plan-out[Write generated plan JSON to a file]" \
    "--json[Output JSON]"
}

_nullclaw_secrets_apply() {
  _arguments -C \
    "--from[Path to plan JSON]" \
    "--dry-run[Validate/preflight only]" \
    "--json[Output JSON]"
}

_nullclaw_secrets() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'reload[Re-resolve secret references and atomically swap runtime snapshot]' 'audit[Audit plaintext secrets, unresolved refs, and precedence drift]' 'configure[Interactive secrets helper (provider setup + SecretRef mapping + preflight)]' 'apply[Apply a previously generated secrets plan]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (reload) _nullclaw_secrets_reload ;;
        (audit) _nullclaw_secrets_audit ;;
        (configure) _nullclaw_secrets_configure ;;
        (apply) _nullclaw_secrets_apply ;;
      esac
      ;;
  esac
}

_nullclaw_skills_list() {
  _arguments -C \
    "--json[Output as JSON]" \
    "--eligible[Show only eligible (ready to use) skills]" \
    "(--verbose -v)"{--verbose,-v}"[Show more details including missing requirements]"
}

_nullclaw_skills_info() {
  _arguments -C \
    "--json[Output as JSON]"
}

_nullclaw_skills_check() {
  _arguments -C \
    "--json[Output as JSON]"
}

_nullclaw_skills() {
  local -a commands
  local -a options
  
  _arguments -C \
     \
    "1: :_values 'command' 'list[List all available skills]' 'info[Show detailed information about a skill]' 'check[Check which skills are ready vs missing requirements]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (list) _nullclaw_skills_list ;;
        (info) _nullclaw_skills_info ;;
        (check) _nullclaw_skills_check ;;
      esac
      ;;
  esac
}

_nullclaw_update_wizard() {
  _arguments -C \
    "--timeout[Timeout for each update step in seconds (default: 1200)]"
}

_nullclaw_update_status() {
  _arguments -C \
    "--json[Output result as JSON]" \
    "--timeout[Timeout for update checks in seconds (default: 3)]"
}

_nullclaw_update() {
  local -a commands
  local -a options
  
  _arguments -C \
    "--json[Output result as JSON]" \
    "--no-restart[Skip restarting the gateway service after a successful update]" \
    "--dry-run[Preview update actions without making changes]" \
    "--channel[Persist update channel (git + npm)]" \
    "--tag[Override npm dist-tag or version for this update]" \
    "--timeout[Timeout for each update step in seconds (default: 1200)]" \
    "--yes[Skip confirmation prompts (non-interactive)]" \
    "1: :_values 'command' 'wizard[Interactive update wizard]' 'status[Show update channel and version status]'" \
    "*::arg:->args"

  case $state in
    (args)
      case $line[1] in
        (wizard) _nullclaw_update_wizard ;;
        (status) _nullclaw_update_status ;;
      esac
      ;;
  esac
}


compdef _nullclaw_root_completion nullclaw
