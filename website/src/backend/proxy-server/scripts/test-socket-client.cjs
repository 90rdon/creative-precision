const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('Connected to server');

    // Send a message
    const messages = [
        { role: 'model', text: 'Hello, what are your goals?' },
        { role: 'user', text: 'I am looking to scale AI in my construction 100M business' }
    ];

    socket.emit('chat-message', { messages });
});

socket.on('state-update', (data) => {
    console.log('State updated:', data.type);
});

socket.on('chat-chunk', (data) => {
    if (data.done) {
        console.log('\n[Stream Complete]');
        process.exit(0);
    } else {
        process.stdout.write(data.chunk);
    }
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
});

// Timeout
setTimeout(() => {
    console.error('\nTimeout waiting for response');
    process.exit(1);
}, 20000);
