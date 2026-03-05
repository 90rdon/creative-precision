
Register-ArgumentCompleter -Native -CommandName nullclaw -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    
    $commandElements = $commandAst.CommandElements
    $commandPath = ""
    
    # Reconstruct command path (simple approximation)
    # Skip the executable name
    for ($i = 1; $i -lt $commandElements.Count; $i++) {
        $element = $commandElements[$i].Extent.Text
        if ($element -like "-*") { break }
        if ($i -eq $commandElements.Count - 1 -and $wordToComplete -ne "") { break } # Don't include current word being typed
        $commandPath += "$element "
    }
    $commandPath = $commandPath.Trim()
    
    # Root command
    if ($commandPath -eq "") {
         $completions = @('completion','setup','onboard','configure','config','doctor','dashboard','reset','uninstall','message','memory','agent','agents','status','health','sessions','browser','acp','gateway','daemon','logs','system','models','approvals','nodes','devices','node','sandbox','tui','cron','dns','docs','hooks','webhooks','qr','clawbot','pairing','plugins','channels','directory','security','secrets','skills','update', '-V,','--dev','--profile','--log-level','--no-color') 
         $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
         }
    }
    
    
            if ($commandPath -eq 'nullclaw') {
                $completions = @('completion','setup','onboard','configure','config','doctor','dashboard','reset','uninstall','message','memory','agent','agents','status','health','sessions','browser','acp','gateway','daemon','logs','system','models','approvals','nodes','devices','node','sandbox','tui','cron','dns','docs','hooks','webhooks','qr','clawbot','pairing','plugins','channels','directory','security','secrets','skills','update','-V','--dev','--profile','--log-level','--no-color')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw completion') {
                $completions = @('-s','-i','--write-state','-y')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw setup') {
                $completions = @('--workspace','--wizard','--non-interactive','--mode','--remote-url','--remote-token')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw onboard') {
                $completions = @('--workspace','--reset','--reset-scope','--non-interactive','--accept-risk','--flow','--mode','--auth-choice','--token-provider','--token','--token-profile-id','--token-expires-in','--secret-input-mode','--cloudflare-ai-gateway-account-id','--cloudflare-ai-gateway-gateway-id','--anthropic-api-key','--openai-api-key','--mistral-api-key','--openrouter-api-key','--kilocode-api-key','--ai-gateway-api-key','--cloudflare-ai-gateway-api-key','--moonshot-api-key','--kimi-code-api-key','--gemini-api-key','--zai-api-key','--xiaomi-api-key','--minimax-api-key','--synthetic-api-key','--venice-api-key','--together-api-key','--huggingface-api-key','--opencode-zen-api-key','--xai-api-key','--litellm-api-key','--qianfan-api-key','--volcengine-api-key','--byteplus-api-key','--custom-base-url','--custom-api-key','--custom-model-id','--custom-provider-id','--custom-compatibility','--gateway-port','--gateway-bind','--gateway-auth','--gateway-token','--gateway-password','--remote-url','--remote-token','--tailscale','--tailscale-reset-on-exit','--install-daemon','--no-install-daemon','--skip-daemon','--daemon-runtime','--skip-channels','--skip-skills','--skip-health','--skip-ui','--node-manager','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw configure') {
                $completions = @('--section')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw config') {
                $completions = @('get','set','unset','--section')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw config get') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw config set') {
                $completions = @('--strict-json','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw doctor') {
                $completions = @('--no-workspace-suggestions','--yes','--repair','--fix','--force','--non-interactive','--generate-gateway-token','--deep')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw dashboard') {
                $completions = @('--no-open')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw reset') {
                $completions = @('--scope','--yes','--non-interactive','--dry-run')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw uninstall') {
                $completions = @('--service','--state','--workspace','--app','--all','--yes','--non-interactive','--dry-run')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message') {
                $completions = @('send','broadcast','poll','react','reactions','read','edit','delete','pin','unpin','pins','permissions','search','thread','emoji','sticker','role','channel','member','voice','event','timeout','kick','ban')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message send') {
                $completions = @('-m','-t','--media','--buttons','--components','--card','--reply-to','--thread-id','--gif-playback','--silent','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message broadcast') {
                $completions = @('--channel','--account','--json','--dry-run','--verbose','--targets','--message','--media')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message poll') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose','--poll-question','--poll-option','--poll-multi','--poll-duration-hours','--poll-duration-seconds','--poll-anonymous','--poll-public','-m','--silent','--thread-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message react') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose','--message-id','--emoji','--remove','--participant','--from-me','--target-author','--target-author-uuid')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message reactions') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose','--message-id','--limit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message read') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose','--limit','--before','--after','--around','--include-thread')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message edit') {
                $completions = @('--message-id','-m','-t','--channel','--account','--json','--dry-run','--verbose','--thread-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message delete') {
                $completions = @('--message-id','-t','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message pin') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose','--message-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message unpin') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose','--message-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message pins') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose','--limit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message permissions') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message search') {
                $completions = @('--channel','--account','--json','--dry-run','--verbose','--guild-id','--query','--channel-id','--channel-ids','--author-id','--author-ids','--limit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message thread') {
                $completions = @('create','list','reply')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message thread create') {
                $completions = @('--thread-name','-t','--channel','--account','--json','--dry-run','--verbose','--message-id','-m','--auto-archive-min')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message thread list') {
                $completions = @('--guild-id','--channel','--account','--json','--dry-run','--verbose','--channel-id','--include-archived','--before','--limit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message thread reply') {
                $completions = @('-m','-t','--channel','--account','--json','--dry-run','--verbose','--media','--reply-to')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message emoji') {
                $completions = @('list','upload')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message emoji list') {
                $completions = @('--channel','--account','--json','--dry-run','--verbose','--guild-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message emoji upload') {
                $completions = @('--guild-id','--channel','--account','--json','--dry-run','--verbose','--emoji-name','--media','--role-ids')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message sticker') {
                $completions = @('send','upload')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message sticker send') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose','--sticker-id','-m')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message sticker upload') {
                $completions = @('--guild-id','--channel','--account','--json','--dry-run','--verbose','--sticker-name','--sticker-desc','--sticker-tags','--media')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message role') {
                $completions = @('info','add','remove')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message role info') {
                $completions = @('--guild-id','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message role add') {
                $completions = @('--guild-id','--user-id','--role-id','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message role remove') {
                $completions = @('--guild-id','--user-id','--role-id','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message channel') {
                $completions = @('info','list')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message channel info') {
                $completions = @('-t','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message channel list') {
                $completions = @('--guild-id','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message member') {
                $completions = @('info')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message member info') {
                $completions = @('--user-id','--channel','--account','--json','--dry-run','--verbose','--guild-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message voice') {
                $completions = @('status')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message voice status') {
                $completions = @('--guild-id','--user-id','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message event') {
                $completions = @('list','create')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message event list') {
                $completions = @('--guild-id','--channel','--account','--json','--dry-run','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message event create') {
                $completions = @('--guild-id','--event-name','--start-time','--channel','--account','--json','--dry-run','--verbose','--end-time','--desc','--channel-id','--location','--event-type')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message timeout') {
                $completions = @('--guild-id','--user-id','--channel','--account','--json','--dry-run','--verbose','--duration-min','--until','--reason')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message kick') {
                $completions = @('--guild-id','--user-id','--channel','--account','--json','--dry-run','--verbose','--reason')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw message ban') {
                $completions = @('--guild-id','--user-id','--channel','--account','--json','--dry-run','--verbose','--reason','--delete-days')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw memory') {
                $completions = @('status','index','search')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw memory status') {
                $completions = @('--agent','--json','--deep','--index','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw memory index') {
                $completions = @('--agent','--force','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw memory search') {
                $completions = @('--query','--agent','--max-results','--min-score','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agent') {
                $completions = @('-m','-t','--session-id','--agent','--thinking','--verbose','--channel','--reply-to','--reply-channel','--reply-account','--local','--deliver','--json','--timeout')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agents') {
                $completions = @('list','bindings','bind','unbind','add','set-identity','delete')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agents list') {
                $completions = @('--json','--bindings')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agents bindings') {
                $completions = @('--agent','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agents bind') {
                $completions = @('--agent','--bind','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agents unbind') {
                $completions = @('--agent','--bind','--all','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agents add') {
                $completions = @('--workspace','--model','--agent-dir','--bind','--non-interactive','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agents set-identity') {
                $completions = @('--agent','--workspace','--identity-file','--from-identity','--name','--theme','--emoji','--avatar','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw agents delete') {
                $completions = @('--force','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw status') {
                $completions = @('--json','--all','--usage','--deep','--timeout','--verbose','--debug')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw health') {
                $completions = @('--json','--timeout','--verbose','--debug')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw sessions') {
                $completions = @('cleanup','--json','--verbose','--store','--agent','--all-agents','--active')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw sessions cleanup') {
                $completions = @('--store','--agent','--all-agents','--dry-run','--enforce','--fix-missing','--active-key','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser') {
                $completions = @('status','start','stop','reset-profile','tabs','tab','open','focus','close','profiles','create-profile','delete-profile','extension','screenshot','snapshot','navigate','resize','click','type','press','hover','scrollintoview','drag','select','upload','waitfordownload','download','dialog','fill','wait','evaluate','console','pdf','responsebody','highlight','errors','requests','trace','cookies','storage','set','--browser-profile','--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser tab') {
                $completions = @('new','select','close')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser create-profile') {
                $completions = @('--name','--color','--cdp-url','--driver')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser delete-profile') {
                $completions = @('--name')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser extension') {
                $completions = @('install','path')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser screenshot') {
                $completions = @('--full-page','--ref','--element','--type')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser snapshot') {
                $completions = @('--format','--target-id','--limit','--mode','--efficient','--interactive','--compact','--depth','--selector','--frame','--labels','--out')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser navigate') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser resize') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser click') {
                $completions = @('--target-id','--double','--button','--modifiers')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser type') {
                $completions = @('--submit','--slowly','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser press') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser hover') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser scrollintoview') {
                $completions = @('--target-id','--timeout-ms')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser drag') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser select') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser upload') {
                $completions = @('--ref','--input-ref','--element','--target-id','--timeout-ms')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser waitfordownload') {
                $completions = @('--target-id','--timeout-ms')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser download') {
                $completions = @('--target-id','--timeout-ms')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser dialog') {
                $completions = @('--accept','--dismiss','--prompt','--target-id','--timeout-ms')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser fill') {
                $completions = @('--fields','--fields-file','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser wait') {
                $completions = @('--time','--text','--text-gone','--url','--load','--fn','--timeout-ms','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser evaluate') {
                $completions = @('--fn','--ref','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser console') {
                $completions = @('--level','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser pdf') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser responsebody') {
                $completions = @('--target-id','--timeout-ms','--max-chars')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser highlight') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser errors') {
                $completions = @('--clear','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser requests') {
                $completions = @('--filter','--clear','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser trace') {
                $completions = @('start','stop')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser trace start') {
                $completions = @('--target-id','--no-screenshots','--no-snapshots','--sources')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser trace stop') {
                $completions = @('--out','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser cookies') {
                $completions = @('set','clear','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser cookies set') {
                $completions = @('--url','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser cookies clear') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage') {
                $completions = @('local','session')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage local') {
                $completions = @('get','set','clear')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage local get') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage local set') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage local clear') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage session') {
                $completions = @('get','set','clear')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage session get') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage session set') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser storage session clear') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set') {
                $completions = @('viewport','offline','headers','credentials','geo','media','timezone','locale','device')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set viewport') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set offline') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set headers') {
                $completions = @('--headers-json','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set credentials') {
                $completions = @('--clear','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set geo') {
                $completions = @('--clear','--accuracy','--origin','--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set media') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set timezone') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set locale') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw browser set device') {
                $completions = @('--target-id')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw acp') {
                $completions = @('client','--url','--token','--token-file','--password','--password-file','--session','--session-label','--require-existing','--reset-session','--no-prefix-cwd','-v')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw acp client') {
                $completions = @('--cwd','--server','--server-args','--server-verbose','-v')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway') {
                $completions = @('run','status','install','uninstall','start','stop','restart','call','usage-cost','health','probe','discover','--port','--bind','--token','--auth','--password','--tailscale','--tailscale-reset-on-exit','--allow-unconfigured','--dev','--reset','--force','--verbose','--claude-cli-logs','--ws-log','--compact','--raw-stream','--raw-stream-path')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway run') {
                $completions = @('--port','--bind','--token','--auth','--password','--tailscale','--tailscale-reset-on-exit','--allow-unconfigured','--dev','--reset','--force','--verbose','--claude-cli-logs','--ws-log','--compact','--raw-stream','--raw-stream-path')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway status') {
                $completions = @('--url','--token','--password','--timeout','--no-probe','--deep','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway install') {
                $completions = @('--port','--runtime','--token','--force','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway uninstall') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway start') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway stop') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway restart') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway call') {
                $completions = @('--params','--url','--token','--password','--timeout','--expect-final','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway usage-cost') {
                $completions = @('--days','--url','--token','--password','--timeout','--expect-final','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway health') {
                $completions = @('--url','--token','--password','--timeout','--expect-final','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway probe') {
                $completions = @('--url','--ssh','--ssh-identity','--ssh-auto','--token','--password','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw gateway discover') {
                $completions = @('--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw daemon') {
                $completions = @('status','install','uninstall','start','stop','restart')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw daemon status') {
                $completions = @('--url','--token','--password','--timeout','--no-probe','--deep','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw daemon install') {
                $completions = @('--port','--runtime','--token','--force','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw daemon uninstall') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw daemon start') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw daemon stop') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw daemon restart') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw logs') {
                $completions = @('--limit','--max-bytes','--follow','--interval','--json','--plain','--no-color','--local-time','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw system') {
                $completions = @('event','heartbeat','presence')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw system event') {
                $completions = @('--text','--mode','--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw system heartbeat') {
                $completions = @('last','enable','disable')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw system heartbeat last') {
                $completions = @('--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw system heartbeat enable') {
                $completions = @('--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw system heartbeat disable') {
                $completions = @('--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw system presence') {
                $completions = @('--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models') {
                $completions = @('list','status','set','set-image','aliases','fallbacks','image-fallbacks','scan','auth','--status-json','--status-plain','--agent')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models list') {
                $completions = @('--all','--local','--provider','--json','--plain')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models status') {
                $completions = @('--json','--plain','--check','--probe','--probe-provider','--probe-profile','--probe-timeout','--probe-concurrency','--probe-max-tokens','--agent')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models aliases') {
                $completions = @('list','add','remove')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models aliases list') {
                $completions = @('--json','--plain')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models fallbacks') {
                $completions = @('list','add','remove','clear')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models fallbacks list') {
                $completions = @('--json','--plain')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models image-fallbacks') {
                $completions = @('list','add','remove','clear')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models image-fallbacks list') {
                $completions = @('--json','--plain')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models scan') {
                $completions = @('--min-params','--max-age-days','--provider','--max-candidates','--timeout','--concurrency','--no-probe','--yes','--no-input','--set-default','--set-image','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth') {
                $completions = @('add','login','setup-token','paste-token','login-github-copilot','order','--agent')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth login') {
                $completions = @('--provider','--method','--set-default')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth setup-token') {
                $completions = @('--provider','--yes')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth paste-token') {
                $completions = @('--provider','--profile-id','--expires-in')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth login-github-copilot') {
                $completions = @('--profile-id','--yes')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth order') {
                $completions = @('get','set','clear')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth order get') {
                $completions = @('--provider','--agent','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth order set') {
                $completions = @('--provider','--agent')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw models auth order clear') {
                $completions = @('--provider','--agent')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw approvals') {
                $completions = @('get','set','allowlist')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw approvals get') {
                $completions = @('--node','--gateway','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw approvals set') {
                $completions = @('--node','--gateway','--file','--stdin','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw approvals allowlist') {
                $completions = @('add','remove')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw approvals allowlist add') {
                $completions = @('--node','--gateway','--agent','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw approvals allowlist remove') {
                $completions = @('--node','--gateway','--agent','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes') {
                $completions = @('status','describe','list','pending','approve','reject','rename','invoke','run','notify','push','canvas','camera','screen','location')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes status') {
                $completions = @('--connected','--last-connected','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes describe') {
                $completions = @('--node','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes list') {
                $completions = @('--connected','--last-connected','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes pending') {
                $completions = @('--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes approve') {
                $completions = @('--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes reject') {
                $completions = @('--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes rename') {
                $completions = @('--node','--name','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes invoke') {
                $completions = @('--node','--command','--params','--invoke-timeout','--idempotency-key','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes run') {
                $completions = @('--node','--cwd','--env','--raw','--agent','--ask','--security','--command-timeout','--needs-screen-recording','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes notify') {
                $completions = @('--node','--title','--body','--sound','--priority','--delivery','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes push') {
                $completions = @('--node','--title','--body','--environment','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas') {
                $completions = @('snapshot','present','hide','navigate','eval','a2ui')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas snapshot') {
                $completions = @('--node','--format','--max-width','--quality','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas present') {
                $completions = @('--node','--target','--x','--y','--width','--height','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas hide') {
                $completions = @('--node','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas navigate') {
                $completions = @('--node','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas eval') {
                $completions = @('--js','--node','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas a2ui') {
                $completions = @('push','reset')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas a2ui push') {
                $completions = @('--jsonl','--text','--node','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes canvas a2ui reset') {
                $completions = @('--node','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes camera') {
                $completions = @('list','snap','clip')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes camera list') {
                $completions = @('--node','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes camera snap') {
                $completions = @('--node','--facing','--device-id','--max-width','--quality','--delay-ms','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes camera clip') {
                $completions = @('--node','--facing','--device-id','--duration','--no-audio','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes screen') {
                $completions = @('record')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes screen record') {
                $completions = @('--node','--screen','--duration','--fps','--no-audio','--out','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes location') {
                $completions = @('get')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw nodes location get') {
                $completions = @('--node','--max-age','--accuracy','--location-timeout','--invoke-timeout','--url','--token','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw devices') {
                $completions = @('list','remove','clear','approve','reject','rotate','revoke')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw devices list') {
                $completions = @('--url','--token','--password','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw devices remove') {
                $completions = @('--url','--token','--password','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw devices clear') {
                $completions = @('--pending','--yes','--url','--token','--password','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw devices approve') {
                $completions = @('--latest','--url','--token','--password','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw devices reject') {
                $completions = @('--url','--token','--password','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw devices rotate') {
                $completions = @('--device','--role','--scope','--url','--token','--password','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw devices revoke') {
                $completions = @('--device','--role','--url','--token','--password','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw node') {
                $completions = @('run','status','install','uninstall','stop','restart')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw node run') {
                $completions = @('--host','--port','--tls','--tls-fingerprint','--node-id','--display-name')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw node status') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw node install') {
                $completions = @('--host','--port','--tls','--tls-fingerprint','--node-id','--display-name','--runtime','--force','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw node uninstall') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw node stop') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw node restart') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw sandbox') {
                $completions = @('list','recreate','explain')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw sandbox list') {
                $completions = @('--json','--browser')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw sandbox recreate') {
                $completions = @('--all','--session','--agent','--browser','--force')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw sandbox explain') {
                $completions = @('--session','--agent','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw tui') {
                $completions = @('--url','--token','--password','--session','--deliver','--thinking','--message','--timeout-ms','--history-limit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron') {
                $completions = @('status','list','add','rm','enable','disable','runs','run','edit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron status') {
                $completions = @('--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron list') {
                $completions = @('--all','--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron add') {
                $completions = @('--name','--description','--disabled','--delete-after-run','--keep-after-run','--agent','--session','--session-key','--wake','--at','--every','--cron','--tz','--stagger','--exact','--system-event','--message','--thinking','--model','--timeout-seconds','--announce','--deliver','--no-deliver','--channel','--to','--best-effort-deliver','--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron rm') {
                $completions = @('--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron enable') {
                $completions = @('--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron disable') {
                $completions = @('--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron runs') {
                $completions = @('--id','--limit','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron run') {
                $completions = @('--due','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw cron edit') {
                $completions = @('--name','--description','--enable','--disable','--delete-after-run','--keep-after-run','--session','--agent','--clear-agent','--session-key','--clear-session-key','--wake','--at','--every','--cron','--tz','--stagger','--exact','--system-event','--message','--thinking','--model','--timeout-seconds','--announce','--deliver','--no-deliver','--channel','--to','--best-effort-deliver','--no-best-effort-deliver','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw dns') {
                $completions = @('setup')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw dns setup') {
                $completions = @('--domain','--apply')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw hooks') {
                $completions = @('list','info','check','enable','disable','install','update')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw hooks list') {
                $completions = @('--eligible','--json','-v')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw hooks info') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw hooks check') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw hooks install') {
                $completions = @('-l','--pin')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw hooks update') {
                $completions = @('--all','--dry-run')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw webhooks') {
                $completions = @('gmail')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw webhooks gmail') {
                $completions = @('setup','run')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw webhooks gmail setup') {
                $completions = @('--account','--project','--topic','--subscription','--label','--hook-url','--hook-token','--push-token','--bind','--port','--path','--include-body','--max-bytes','--renew-minutes','--tailscale','--tailscale-path','--tailscale-target','--push-endpoint','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw webhooks gmail run') {
                $completions = @('--account','--topic','--subscription','--label','--hook-url','--hook-token','--push-token','--bind','--port','--path','--include-body','--max-bytes','--renew-minutes','--tailscale','--tailscale-path','--tailscale-target')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw qr') {
                $completions = @('--remote','--url','--public-url','--token','--password','--setup-code-only','--no-ascii','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw clawbot') {
                $completions = @('qr')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw clawbot qr') {
                $completions = @('--remote','--url','--public-url','--token','--password','--setup-code-only','--no-ascii','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw pairing') {
                $completions = @('list','approve')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw pairing list') {
                $completions = @('--channel','--account','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw pairing approve') {
                $completions = @('--channel','--account','--notify')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw plugins') {
                $completions = @('list','info','enable','disable','uninstall','install','update','doctor')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw plugins list') {
                $completions = @('--json','--enabled','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw plugins info') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw plugins uninstall') {
                $completions = @('--keep-files','--keep-config','--force','--dry-run')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw plugins install') {
                $completions = @('-l','--pin')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw plugins update') {
                $completions = @('--all','--dry-run')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels') {
                $completions = @('list','status','capabilities','resolve','logs','add','remove','login','logout')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels list') {
                $completions = @('--no-usage','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels status') {
                $completions = @('--probe','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels capabilities') {
                $completions = @('--channel','--account','--target','--timeout','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels resolve') {
                $completions = @('--channel','--account','--kind','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels logs') {
                $completions = @('--channel','--lines','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels add') {
                $completions = @('--channel','--account','--name','--token','--token-file','--bot-token','--app-token','--signal-number','--cli-path','--db-path','--service','--region','--auth-dir','--http-url','--http-host','--http-port','--webhook-path','--webhook-url','--audience-type','--audience','--homeserver','--user-id','--access-token','--password','--device-name','--initial-sync-limit','--ship','--url','--code','--group-channels','--dm-allowlist','--auto-discover-channels','--no-auto-discover-channels','--use-env')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels remove') {
                $completions = @('--channel','--account','--delete')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels login') {
                $completions = @('--channel','--account','--verbose')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw channels logout') {
                $completions = @('--channel','--account')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw directory') {
                $completions = @('self','peers','groups')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw directory self') {
                $completions = @('--channel','--account','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw directory peers') {
                $completions = @('list')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw directory peers list') {
                $completions = @('--channel','--account','--json','--query','--limit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw directory groups') {
                $completions = @('list','members')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw directory groups list') {
                $completions = @('--channel','--account','--json','--query','--limit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw directory groups members') {
                $completions = @('--group-id','--channel','--account','--json','--limit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw security') {
                $completions = @('audit')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw security audit') {
                $completions = @('--deep','--fix','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw secrets') {
                $completions = @('reload','audit','configure','apply')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw secrets reload') {
                $completions = @('--json','--url','--token','--timeout','--expect-final')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw secrets audit') {
                $completions = @('--check','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw secrets configure') {
                $completions = @('--apply','--yes','--providers-only','--skip-provider-setup','--plan-out','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw secrets apply') {
                $completions = @('--from','--dry-run','--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw skills') {
                $completions = @('list','info','check')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw skills list') {
                $completions = @('--json','--eligible','-v')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw skills info') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw skills check') {
                $completions = @('--json')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw update') {
                $completions = @('wizard','status','--json','--no-restart','--dry-run','--channel','--tag','--timeout','--yes')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw update wizard') {
                $completions = @('--timeout')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

            if ($commandPath -eq 'nullclaw update status') {
                $completions = @('--json','--timeout')
                $completions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
                }
            }

}
