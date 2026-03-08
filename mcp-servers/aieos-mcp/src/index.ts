
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";
import { promisify } from "util";
import { getDb } from "./store.js";
import { AgentInstance, Persona, StateFragment, Relationship } from "./types.js";

const execAsync = promisify(exec);

const server = new McpServer({
    name: "NullClaw-AIEOS",
    version: "1.0.0",
});

// --- Tools Implementation ---

// 1. List Instances
server.tool(
    "list_instances",
    "Returns all registered NullClaw/OpenClaw instances and their cached status.",
    {},
    async () => {
        const db = await getDb();
        return {
            content: [{ type: "text", text: JSON.stringify(db.data.instances, null, 2) }],
        };
    }
);

// 2. Register Instance
server.tool(
    "register_instance",
    "Adds a new NullClaw or OpenClaw instance to the AIEOS registry.",
    {
        id: z.string().describe("Unique ID for the instance"),
        type: z.enum(["nullclaw", "openclaw"]),
        endpoint: z.string().describe("Base URL of the instance gateway"),
        token: z.string().optional().describe("Authentication token"),
        environment: z.string().optional().describe("Environment name (e.g., local, dev, prod)"),
    },
    async ({ id, type, endpoint, token, environment }) => {
        const db = await getDb();
        const newInstance: AgentInstance = {
            id,
            type,
            endpoint,
            token,
            metadata: {
                environment,
            },
            status: 'offline',
        };

        const existingIndex = db.data.instances.findIndex(i => i.id === id);
        if (existingIndex >= 0) {
            db.data.instances[existingIndex] = { ...db.data.instances[existingIndex], ...newInstance };
        } else {
            db.data.instances.push(newInstance);
        }

        await db.write();
        return {
            content: [{ type: "text", text: `Instance '${id}' registered successfully.` }],
        };
    }
);

// 3. Get Instance Status (Live)
server.tool(
    "get_instance_status",
    "Fetches live health and hardware details from an instance.",
    {
        id: z.string(),
    },
    async ({ id }) => {
        const db = await getDb();
        const instance = db.data.instances.find(i => i.id === id);
        if (!instance) {
            return { content: [{ type: "text", text: `Instance '${id}' not found.` }] };
        }

        try {
            const response = await axios.get(`${instance.endpoint}/health`, {
                timeout: 3000,
                headers: instance.token ? { 'Authorization': `Bearer ${instance.token}` } : {}
            }).catch(err => {
                return axios.get(instance.endpoint, { timeout: 3000 });
            });

            instance.status = 'online';
            instance.lastSeen = new Date().toISOString();
            instance.metadata = {
                ...instance.metadata,
                hardware: {
                    cpu: "Detected Online",
                    memory: "Resource Available",
                    os: "Remote/Container"
                }
            };

            await db.write();

            return {
                content: [{
                    type: "text", text: JSON.stringify({
                        id: instance.id,
                        status: instance.status,
                        lastSeen: instance.lastSeen,
                        details: response.data
                    }, null, 2)
                }],
            };
        } catch (error: any) {
            instance.status = 'offline';
            await db.write();
            return {
                content: [{ type: "text", text: `Instance '${id}' is offline. Error: ${error.message}` }],
            };
        }
    }
);

// --- NEW ORCHESTRATION TOOLS ---

// 4. Restart Instance
server.tool(
    "restart_instance",
    "Attempts to restart an instance via cloud/K8s commands.",
    {
        id: z.string(),
    },
    async ({ id }) => {
        const db = await getDb();
        const instance = db.data.instances.find(i => i.id === id);
        if (!instance) return { content: [{ type: "text", text: "Instance not found." }] };

        try {
            let cmd = "";
            if (id.includes("kube")) {
                cmd = `kubectl rollout restart deployment/${id} -n ${id}`;
            } else {
                cmd = `pkill -f ${id} || echo "No local process found"`;
            }

            const { stdout, stderr } = await execAsync(cmd);
            return { content: [{ type: "text", text: `Restart initiated for ${id}.\nSTDOUT: ${stdout}\nSTDERR: ${stderr}` }] };
        } catch (err: any) {
            return { content: [{ type: "text", text: `Restart failed: ${err.message}` }] };
        }
    }
);

// 5. Deploy Persona
server.tool(
    "deploy_persona",
    "Pushes a persona configuration to a specific instance.",
    {
        instanceId: z.string(),
        personaId: z.string(),
        name: z.string(),
        role: z.string(),
        dna: z.string(),
    },
    async (params) => {
        const db = await getDb();
        const persona: Persona = {
            instanceId: params.instanceId,
            personaId: params.personaId,
            name: params.name,
            role: params.role,
            dna: params.dna,
        };

        const idx = db.data.personas.findIndex(p => p.personaId === params.personaId);
        if (idx >= 0) db.data.personas[idx] = persona;
        else db.data.personas.push(persona);

        await db.write();
        return { content: [{ type: "text", text: `Persona '${params.name}' deployed to AIEOS registry for '${params.instanceId}'.` }] };
    }
);

// --- NEW OBSERVABILITY TOOLS ---

// 6. Fleet Health Summary
server.tool(
    "fleet_health_summary",
    "Generates a bird's eye view of the entire agent fleet.",
    {},
    async () => {
        const db = await getDb();
        const total = db.data.instances.length;
        const online = db.data.instances.filter(i => i.status === 'online').length;
        const summary = db.data.instances.map(i => `[${i.status === 'online' ? '🟢' : '🔴'}] ${i.id} (${i.endpoint})`).join('\n');

        return {
            content: [{ type: "text", text: `### Fleet Health Summary\nTotal: ${total} | Online: ${online}\n\n${summary}` }],
        };
    }
);

// 7. Tail Instance Logs
server.tool(
    "tail_instance_logs",
    "Retrieves recent logs from an agent instance.",
    {
        id: z.string(),
        lines: z.number().default(20),
    },
    async ({ id, lines }) => {
        try {
            let cmd = id.includes("kube")
                ? `kubectl logs deployment/${id} -n ${id} --tail=${lines}`
                : `tail -n ${lines} /tmp/${id}.log 2>/dev/null || echo "No local log file found at /tmp/${id}.log"`;

            const { stdout } = await execAsync(cmd);
            return { content: [{ type: "text", text: `--- Logs for ${id} ---\n${stdout}` }] };
        } catch (err: any) {
            return { content: [{ type: "text", text: `Log retrieval failed: ${err.message}` }] };
        }
    }
);

// --- NEW MEMORY GOVERNANCE TOOLS ---

// 8. Trace Memory
server.tool(
    "trace_memory",
    "Shows which memories were recently retrieved or saved for an agent.",
    {
        agentId: z.string(),
        topic: z.string().optional(),
    },
    async ({ agentId, topic }) => {
        const db = await getDb();
        let memories = db.data.memories.filter(m => m.agentId === agentId);
        if (topic) memories = memories.filter(m => m.topic.includes(topic));

        return {
            content: [{ type: "text", text: JSON.stringify(memories.slice(-5), null, 2) }],
        };
    }
);

// 9. Broadcast Context
server.tool(
    "broadcast_context",
    "Injects a global fact or context into all agents' memories.",
    {
        topic: z.string(),
        content: z.string(),
    },
    async ({ topic, content }) => {
        const db = await getDb();
        const timestamp = new Date().toISOString();

        db.data.instances.forEach(inst => {
            db.data.memories.push({
                id: uuidv4(),
                agentId: inst.id,
                topic,
                content: `[GLOBAL_BROADCAST] ${content}`,
                timestamp
            });
        });

        await db.write();
        return { content: [{ type: "text", text: `Context broadcasted to ${db.data.instances.length} agents.` }] };
    }
);

// --- NEW TROUBLESHOOTING ---

// 10. Diagnose Connectivity
server.tool(
    "diagnose_connectivity",
    "Runs a diagnostic trace to find where an agent connection is breaking.",
    {
        id: z.string(),
    },
    async ({ id }) => {
        const db = await getDb();
        const inst = db.data.instances.find(i => i.id === id);
        if (!inst) return { content: [{ type: "text", text: "Instance not found." }] };

        const results = [];

        // Step 1: DNS/Ping
        try {
            const host = new URL(inst.endpoint).hostname;
            await execAsync(`ping -c 1 ${host}`);
            results.push("✅ Network: Host is reachable via Ping.");
        } catch {
            results.push("❌ Network: Host unreachable (Ping failed).");
        }

        // Step 2: Port check
        try {
            const port = new URL(inst.endpoint).port || "80";
            const host = new URL(inst.endpoint).hostname;
            await execAsync(`nc -zv -w 2 ${host} ${port}`);
            results.push(`✅ Application: Port ${port} is open.`);

            // Step 2.5: SSH specialized check for Pi/Vigil
            if (id.includes("vigil") || inst.metadata?.environment === 'raspberry-pi') {
                try {
                    await execAsync(`nc -zv -w 2 ${host} 22`);
                    results.push("✅ SSH: Port 22 is open.");
                } catch {
                    results.push("❌ SSH: Port 22 is closed.");
                }
            }
        } catch {
            results.push("❌ Application: Connection refused on target port.");
        }

        // Step 3: API handshake
        try {
            await axios.get(inst.endpoint, { timeout: 2000 });
            results.push("✅ Application: Gateway is responding to HTTP.");
        } catch (err: any) {
            results.push(`❌ Application: Gateway error (${err.code}).`);
        }

        return { content: [{ type: "text", text: `### Connectivity Diagnostic for ${id}\n\n${results.join('\n')}` }] };
    }
);

// 11. Scan Fleet
server.tool(
    "scan_fleet",
    "Scans the Kubernetes cluster and known remote nodes (like Raspberry Pi) for NullClaw instances.",
    {},
    async () => {
        const db = await getDb();
        const foundInstances: AgentInstance[] = [];

        // --- K8s Scan ---
        try {
            const { stdout } = await execAsync("kubectl get svc -A -o json");
            const data = JSON.parse(stdout);
            data.items.forEach((svc: any) => {
                const ns = svc.metadata.namespace;
                if (ns.startsWith("nullclaw")) {
                    const id = ns;
                    const port = svc.spec.ports[0]?.port || 3000;
                    // For LoadBalancers, use External IP if available, else Cluster IP
                    const externalIp = svc.status.loadBalancer?.ingress?.[0]?.ip || svc.spec.clusterIP;

                    foundInstances.push({
                        id,
                        type: 'nullclaw',
                        endpoint: `http://${externalIp}:${port}`,
                        status: 'online',
                        metadata: { environment: 'kubernetes' }
                    });
                }
            });
        } catch (err) {
            console.error("K8s scan failed:", err);
        }

        // --- Pi Scan (90rdon-berry) ---
        try {
            const piHost = "90rdon-berry.local";
            // Check if reachable via Ping
            await execAsync(`ping -c 1 -W 1 ${piHost}`);

            // Check if reachable via SSH (Port 22)
            let sshStatus = "reachable";
            try {
                await execAsync(`nc -zv -w 2 ${piHost} 22`);
                sshStatus = "online (SSH ready)";
            } catch {
                sshStatus = "online (SSH closed)";
            }

            foundInstances.push({
                id: "nullclaw-vigil",
                type: 'nullclaw',
                endpoint: `http://${piHost}:3000`,
                status: 'online',
                metadata: {
                    environment: 'raspberry-pi',
                    sshStatus
                }
            });
        } catch {
            // Pi not found
        }

        // --- Update DB (Merge found instances and Scan Personas) ---
        for (const found of foundInstances) {
            const idx = db.data.instances.findIndex(i => i.id === found.id);
            let token = "";
            if (idx >= 0) {
                token = db.data.instances[idx].token || "";
                db.data.instances[idx] = { ...found, token };
            } else {
                db.data.instances.push(found);
            }

            // --- Persona Discovery (Robust) ---
            try {
                let configJson = "";
                if (found.metadata?.environment === 'kubernetes') {
                    // Try to read config directly from K8s pod
                    const { stdout } = await execAsync(`kubectl exec deployment/nullclaw -n ${found.id} -- cat /nullclaw-data/config.json`);
                    configJson = stdout;
                } else if (found.metadata?.environment === 'raspberry-pi') {
                    // Potential SSH or assume same config if it's a clone
                    // For now, let's try to hit a meta endpoint or skip
                }

                if (configJson) {
                    const config = JSON.parse(configJson);
                    if (config.agents?.list && Array.isArray(config.agents.list)) {
                        config.agents.list.forEach((agent: any) => {
                            const persona: Persona = {
                                instanceId: found.id,
                                personaId: agent.id,
                                name: agent.name || agent.id,
                                role: agent.role || "Agent",
                                dna: "" // DNA is usually in system.md files
                            };
                            const pIdx = db.data.personas.findIndex(p => p.instanceId === found.id && p.personaId === agent.id);
                            if (pIdx >= 0) db.data.personas[pIdx] = persona;
                            else db.data.personas.push(persona);
                        });
                    }
                }
            } catch (err) {
                // Silently skip if config can't be read
            }
        }

        await db.write();
        const personaCount = db.data.personas.length;
        return {
            content: [{
                type: "text",
                text: `Scan complete.\n- Instances Found: ${foundInstances.length}\n- Personas/Agents Discovered: ${personaCount}\n\n${foundInstances.map(i => `- ${i.id} at ${i.endpoint} [${i.metadata?.environment}]`).join('\n')}`
            }]
        };
    }
);

// --- EXISTING TOOLS ---

server.tool("list_personas", "Lists all personas.", { instanceId: z.string().optional() }, async ({ instanceId }) => {
    const db = await getDb();
    let personas = db.data.personas;
    if (instanceId) personas = personas.filter(p => p.instanceId === instanceId);
    return { content: [{ type: "text", text: JSON.stringify(personas, null, 2) }] };
});

server.tool("save_agent_state", "Saves a state fragment.", { agentId: z.string(), content: z.string(), topic: z.string() }, async (params) => {
    const db = await getDb();
    const fragment: StateFragment = { id: uuidv4(), ...params, timestamp: new Date().toISOString() };
    db.data.memories.push(fragment);
    await db.write();
    return { content: [{ type: "text", text: `State saved: ${fragment.id}` }] };
});

server.tool("get_agent_state", "Retrieves state.", { agentId: z.string(), query: z.string().optional() }, async ({ agentId, query }) => {
    const db = await getDb();
    let fragments = db.data.memories.filter(m => m.agentId === agentId);
    if (query) {
        const q = query.toLowerCase();
        fragments = fragments.filter(m => m.topic.toLowerCase().includes(q) || m.content.toLowerCase().includes(q));
    }
    return { content: [{ type: "text", text: JSON.stringify(fragments, null, 2) }] };
});

// --- Server Start ---

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // process.stderr.write("NullClaw AIEOS MCP Server running on stdio\n");
}

main().catch(console.error);
