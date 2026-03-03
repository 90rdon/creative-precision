import { io } from 'socket.io-client';

const command = process.argv[2];

async function runSimulatorChat(personaUrlOrDescription: string, initialMessage: string) {
    console.log(`[Simulator] Starting synthetic chat session...`);

    // Connect to the local Express server
    const socket = io('http://localhost:3000', {
        auth: { token: 'simulator-auth-token' }
    });

    const sessionId = `synthetic-${Date.now()}`;
    const messages = [
        { role: 'user', text: initialMessage }
    ];

    socket.on('connect', () => {
        console.log(`[Simulator] Connected to API proxy. Session ID: ${sessionId}`);

        // Mark as synthetic so telemetry catches it
        socket.emit('chat-message', {
            sessionId,
            messages,
            isSynthetic: true
        });
    });

    let accumulatedResponse = "";

    socket.on('chat-chunk', (data) => {
        if (data.chunk) {
            accumulatedResponse += data.chunk;
        }
        if (data.done) {
            console.log(`\n\n[Expert Response]: ${accumulatedResponse}`);
            console.log(`[Simulator] Output logged. Terminating simulation.`);
            socket.disconnect();

            // Output JSON for the OpenClaw agent to parse easily
            console.log(JSON.stringify({
                success: true,
                persona: personaUrlOrDescription,
                response: accumulatedResponse
            }));
            process.exit(0);
        }
    });

    socket.on('state-update', (data) => {
        if (data.type === 'error') {
            console.error(`[Simulator] Error from server: ${data.payload.message}`);
            socket.disconnect();
            process.exit(1);
        }
    });

    // Timeout fallback
    setTimeout(() => {
        console.error(`[Simulator] Timeout waiting for Expert agent response.`);
        socket.disconnect();
        process.exit(1);
    }, 30000);
}

if (command === 'run-simulation') {
    const persona = process.argv[3];
    const initialMessage = process.argv[4];
    if (!persona || !initialMessage) {
        console.error("Usage: tsx simulator_tools.ts run-simulation <persona> <initial_message>");
        process.exit(1);
    }
    runSimulatorChat(persona, initialMessage);
} else {
    console.log(`Available commands:\n  tsx simulator_tools.ts run-simulation <persona> <initial_message>`);
}
