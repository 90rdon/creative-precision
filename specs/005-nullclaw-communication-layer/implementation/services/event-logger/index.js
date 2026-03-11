// Vigil Event Logger Service
import express from 'express';
import cors from 'cors';
import { testConnection, query } from './db.js';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 18990;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Redis client for pub/sub
const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

// Connect Redis
redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect().then(() => console.log('✅ Redis connected'));

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/v1/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'healthy',
    database: dbConnected ? 'connected' : 'disconnected',
    redis: redisClient.isOpen ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Log an event
app.post('/api/v1/events', async (req, res) => {
  try {
    const {
      instance_id,
      agent_id,
      event_type,
      category,
      severity = 'info',
      title,
      description,
      metadata = {}
    } = req.body;

    if (!instance_id || !event_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event_id = uuidv4();
    const created_at = new Date().toISOString();

    await query(
      `INSERT INTO events (id, instance_id, agent_id, event_type, category, severity, title, description, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [event_id, instance_id, agent_id, event_type, category, severity, title, description, JSON.stringify(metadata), created_at]
    );

    // Publish to Redis for real-time alerts
    if (severity === 'critical' || severity === 'error') {
      await redisClient.publish('events:alerts', JSON.stringify({
        event_id,
        instance_id,
        severity,
        title,
        description,
        created_at
      }));
    }

    // Publish to health channel
    await redisClient.publish('events:health', JSON.stringify({
      instance_id,
      event_type,
      severity,
      created_at
    }));

    res.json({
      success: true,
      event_id,
      created_at
    });
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log a decision with trace ID
app.post('/api/v1/decisions', async (req, res) => {
  try {
    const {
      instance_id,
      agent_id,
      event_id,
      decision_type,
      decision_context,
      decision_logic,
      decision_outcome,
      result,
      confidence
    } = req.body;

    if (!instance_id || !decision_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const decision_id = uuidv4();
    const created_at = new Date().toISOString();

    await query(
      `INSERT INTO decisions (id, instance_id, agent_id, event_id, decision_type, decision_context, decision_logic, decision_outcome, result, confidence, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        decision_id,
        instance_id,
        agent_id,
        event_id,
        decision_type,
        JSON.stringify(decision_context),
        decision_logic,
        JSON.stringify(decision_outcome),
        result,
        confidence,
        created_at
      ]
    );

    res.json({
      success: true,
      decision_id,
      trace_url: `https://vigil:18990/decisions/${decision_id}`,
      created_at
    });
  } catch (error) {
    console.error('Error logging decision:', error);
    res.status(500).json({ error: error.message });
  }
});

// Report health check from instance
app.post('/api/v1/health/check', async (req, res) => {
  try {
    const { instance_id, service, status, details = {} } = req.body;

    if (!instance_id || !service) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const check_id = uuidv4();
    const checked_at = new Date().toISOString();

    await query(
      `INSERT INTO health_checks (id, instance_id, service, status, checked_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [check_id, instance_id, service, status, checked_at]
    );

    // Update instance last_seen
    await query(
      `UPDATE instances SET last_seen = $2, status = $3 WHERE id = $1`,
      [instance_id, checked_at, status === 'healthy' ? 'online' : 'degraded']
    );

    // Publish to health channel
    await redisClient.publish('events:health', JSON.stringify({
      instance_id,
      service,
      status,
      checked_at
    }));

    res.json({
      success: true,
      check_id,
      checked_at
    });
  } catch (error) {
    console.error('Error reporting health:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create an alert
app.post('/api/v1/alerts', async (req, res) => {
  try {
    const {
      instance_id,
      severity,
      category,
      title,
      description
    } = req.body;

    if (!severity || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const alert_id = uuidv4();
    const created_at = new Date().toISOString();

    await query(
      `INSERT INTO alerts (id, instance_id, severity, category, title, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [alert_id, instance_id, severity, category, title, description, created_at]
    );

    // Publish to alerts channel (Telegram bot subscribes here)
    await redisClient.publish('events:alerts', JSON.stringify({
      alert_id,
      instance_id,
      severity,
      category,
      title,
      description,
      created_at
    }));

    res.json({
      success: true,
      alert_id,
      created_at
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get fleet health summary
app.get('/api/v1/health/summary', async (req, res) => {
  try {
    // Get all instances with latest health check
    const instances = await query(`
      SELECT
        i.id, i.name, i.environment, i.endpoint, i.status as instance_status, i.last_seen,
        json_object_agg(
          h.service,
          json_build_object(
            'status', h.status,
            'checked_at', h.checked_at
          )
        ) as services
      FROM instances i
      LEFT JOIN (
        SELECT DISTINCT ON (instance_id, service) *
        FROM health_checks
        ORDER BY instance_id, service, checked_at DESC
      ) h ON i.id = h.instance_id
      GROUP BY i.id
    `);

    // Get unresolved alerts
    const alerts = await query(`
      SELECT id, title, severity, category, created_at, instance_id
      FROM alerts
      WHERE is_resolved = false
      ORDER BY severity, created_at DESC
    `);

    res.json({
      instances: instances.rows,
      alerts_unresolved: alerts.rows.length,
      alerts: alerts.rows
    });
  } catch (error) {
    console.error('Error getting health summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events for an instance
app.get('/api/v1/events/:instance_id', async (req, res) => {
  try {
    const { instance_id } = req.params;
    const { limit = 50, severity } = req.query;

    let query_str = `
      SELECT e.*, i.name as instance_name, a.name as agent_name
      FROM events e
      LEFT JOIN instances i ON e.instance_id = i.id
      LEFT JOIN agents a ON e.agent_id = a.id
      WHERE e.instance_id = $1
    `;
    const params = [instance_id];

    if (severity) {
      query_str += ' AND e.severity = $2';
      params.push(severity);
    }

    query_str += ' ORDER BY e.created_at DESC LIMIT ' + (parseInt(limit) || 50);

    const result = await query(query_str, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get decisions for an instance/agent
app.get('/api/v1/decisions/:instance_id', async (req, res) => {
  try {
    const { instance_id } = req.params;
    const { agent_id, limit = 50 } = req.query;

    let query_str = `
      SELECT d.*, i.name as instance_name, a.name as agent_name
      FROM decisions d
      LEFT JOIN instances i ON d.instance_id = i.id
      LEFT JOIN agents a ON d.agent_id = a.id
      WHERE d.instance_id = $1
    `;
    const params = [instance_id];

    if (agent_id) {
      query_str += ' AND d.agent_id = $2';
      params.push(agent_id);
    }

    query_str += ' ORDER BY d.created_at DESC LIMIT ' + (parseInt(limit) || 50);

    const result = await query(query_str, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting decisions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Vigil Event Logger running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📝 Event logging: http://localhost:${PORT}/api/v1/events`);
  console.log(`📈 Fleet health: http://localhost:${PORT}/api/v1/health/summary`);

  // Test database connection on startup
  testConnection().then(connected => {
    if (!connected) {
      console.error('⚠️  Database not connected - check configuration');
    }
  });
});

export default app;
