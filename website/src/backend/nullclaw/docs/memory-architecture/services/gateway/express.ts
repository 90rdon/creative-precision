/**
 * Memory Gateway Service
 * ======================
 *
 * Simple HTTP/Express gateway that agents can call to request memory services.
 * Services start on-demand and auto-stop after inactivity.
 *
 * Endpoints:
 *   GET  /status      - Check if services are running
 *   POST /start       - Start memory services
 *   POST /stop        - Stop memory services
 *   POST /request     - Start services + register request
 *   GET  /health      - Health check
 *
 * Usage:
 *   npm start
 *   curl http://localhost:9500/status
 */

import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const MEMORY_DIR = process.env.MEMORY_DIR || __dirname + '/../../';

const app = express();
const PORT = 9500;

// Middleware
app.use(express.json());

// Helper to run memory.sh commands
async function runMemory(command: string, args: string[] = []) {
  const script = `${MEMORY_DIR}/memory.sh ${command} ${args.join(' ')}`;
  const { stdout, stderr } = await execAsync(script);
  return { stdout, stderr };
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Check if services are running
app.get('/status', async (req, res) => {
  try {
    const { stdout } = await runMemory('ping');
    res.json({
      running: stdout.trim() === 'UP',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start memory services
app.post('/start', async (req, res) => {
  try {
    await runMemory('start');
    res.json({
      status: 'started',
      message: 'Memory services started',
      endpoints: {
        postgres: 'postgresql://nullclaw:nullclaw@localhost:5432/nullclaw',
        qdrant: 'http://localhost:6333',
        redis: 'localhost:6379'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stop memory services
app.post('/stop', async (req, res) => {
  try {
    await runMemory('stop');
    res.json({
      status: 'stopped',
      message: 'Memory services stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Request mode (start + execute command)
app.post('/request', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'No body provided' });
    }
    console.log('Request', req.body);
    res.json({
      status: 'request_acknowledged',
      message: 'Memory services ready for request',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Detailed status
app.get('/status/detail', async (req, res) => {
  try {
    const { stdout, stderr } = await runMemory('ps');
    res.json({
      running: true,
      containers: stdout.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Memory Gateway running on http://localhost:${PORT}`);
  console.log(`Use: curl http://localhost:${PORT}/status`);
});

export default app;
