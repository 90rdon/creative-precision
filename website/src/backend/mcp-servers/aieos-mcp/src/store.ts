import { JSONFilePreset } from 'lowdb/node';
import { AIEOSData } from './types.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, '..', 'db.json');

const defaultData: AIEOSData = {
    instances: [],
    personas: [],
    relationships: [],
    memories: []
};

// Use the local file 'db.json' for persistence
export const getDb = async () => {
    return await JSONFilePreset<AIEOSData>(dbPath, defaultData);
};
