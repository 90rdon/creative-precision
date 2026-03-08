/**
 * Supabase Configuration Helper
 * ==============================
 *
 * Type-safe configuration for connecting Atlas and Vigil to Supabase.
 * Run this to generate your instance-specific configs.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SupabaseConfig {
  projectId: string;
  databasePassword: string;
  anonKey?: string;
  serviceRoleKey?: string;
}

interface InstanceConfig {
  instanceId: string;
  instanceName: string;
}

interface AtlasConfig {
  memory: {
    profile: string;
    backend: string;
    database: {
      host: string;
      port: number;
      name: string;
      user: string;
      password: string;
      ssl: boolean;
    };
    vector_db: {
      url: string;
      api_key?: string;
      embedding_model: string;
      dimensions: number;
    };
  };
}

function generateAtlasConfig(
  config: SupabaseConfig,
  instance: InstanceConfig
): AtlasConfig {
  const host = `db.${config.projectId}.supabase.co`;
  const url = `https://${config.projectId}.supabase.co`;

  return {
    memory: {
      profile: 'centralized',
      backend: 'supabase',
      database: {
        host,
        port: 5432,
        name: 'postgres',
        user: 'postgres',
        password: config.databasePassword,
        ssl: true,
      },
      vector_db: {
        url,
        api_key: config.anonKey || '',
        embedding_model: 'nomic-embed-text-v1.5:free',
        dimensions: 1536,
      },
    },
  };
}

// Read existing config if available
function readExistingConfig(): any {
  try {
    const configPath = join(process.cwd(), 'nullclaw_data', 'config.json');
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// Merge new config with existing
function mergeConfigs(existing: any, newConfig: AtlasConfig): any {
  if (!existing) return newConfig;

  return {
    ...existing,
    memory: {
      ...existing.memory,
      ...newConfig.memory,
      database: {
        ...existing.memory?.database,
        ...newConfig.memory?.database,
      },
      vector_db: {
        ...existing.memory?.vector_db,
        ...newConfig.memory?.vector_db,
      },
    },
  };
}

// Main setup flow
function setupSupabase() {
  console.log('=== Supabase Setup Helper ===');
  console.log('');
  console.log('To get your credentials:');
  console.log('1. Go to https://supabase.com');
  console.log('2. Create/select your project');
  console.log('3. Go to Settings → Database');
  console.log('4. Copy these values:');
  console.log('   • Project reference (the string like "abcxyz-some-hash")');
  console.log('   • Database password');
  console.log('');

  // Example setup (customize with real values)
  const exampleConfig: SupabaseConfig = {
    projectId: 'YOUR-PROJECT-REF',
    databasePassword: 'YOUR-DB-PASSWORD',
  };

  const atlasConfig = generateAtlasConfig(exampleConfig, {
    instanceId: 'atlas',
    instanceName: 'Atlas',
  });

  console.log('=== Generated Atlas Config ===');
  console.log(JSON.stringify(atlasConfig, null, 2));
  console.log('');
  console.log('=== Instructions ===');
  console.log('');
  console.log('1. Update nullclaw_data/config.json with the memory configuration above');
  console.log('2. Replace YOUR-PROJECT-REF and YOUR-DB-PASSWORD with actual values');
  console.log('3. Copy same values to Vigil instance config');
  console.log('');
  console.log('=== Vigil Connection ===');
  console.log('');
  console.log('On Vigil (19.0.0.134), edit /data/pi/.nullclaw/config.json:');
  console.log(JSON.stringify(
    {
      memory: {
        backend: 'supabase',
        profile: 'centralized',
        database: {
          host: 'db.YOUR-PROJECT-REF.supabase.co',
          port: 5432,
          name: 'postgres',
          user: 'postgres',
          password: 'YOUR-DB-PASSWORD',
          ssl: true,
        },
      },
    },
    null,
    2
  ));
}

// Run setup
setupSupabase();

/**
 * Example usage:
 *
 * node supabase-config-helper.ts
 *
 * Output will show you exactly what to paste into your config files.
 * Both Atlas and Vigil will point to the same Supabase project.
 */
