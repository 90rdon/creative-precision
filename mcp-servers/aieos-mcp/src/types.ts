export interface AgentInstance {
    id: string; // e.g., "nullclaw-local", "nullclaw-kube"
    type: 'nullclaw' | 'openclaw';
    endpoint: string; // e.g., "http://localhost:3000"
    token?: string;
    metadata?: {
        hardware?: {
            cpu?: string;
            memory?: string;
            os?: string;
        };
        environment?: string;
        sshStatus?: string;
    };
    status?: 'online' | 'offline' | 'degraded';
    lastSeen?: string;
    metrics?: {
        tokensIn?: number;
        tokensOut?: number;
        costEstimate?: number;
        latencyMs?: number;
    };
    logs?: string[];
}

export interface Persona {
    instanceId: string;
    personaId: string;
    name: string;
    role: string;
    dna?: string;
    configuration?: any;
}

export interface Relationship {
    source: { type: 'instance' | 'persona'; id: string };
    target: { type: 'instance' | 'persona'; id: string };
    relationshipType: 'is_subagent_of' | 'shares_memory_with' | 'monitors';
}

export interface StateFragment {
    id: string;
    agentId: string;
    personaId?: string;
    content: string;
    topic: string;
    timestamp: string;
    metadata?: any;
}

export interface AIEOSData {
    instances: AgentInstance[];
    personas: Persona[];
    relationships: Relationship[];
    memories: StateFragment[];
}
