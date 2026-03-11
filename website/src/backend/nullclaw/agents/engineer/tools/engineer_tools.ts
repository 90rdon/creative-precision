/**
 * Engineer Tools
 *
 * Tools used by the Engineer Agent to propose and apply changes based on
 * intelligence from the Synthesizer and Simulator agents.
 */

import { Pool } from 'pg';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Structure for a change proposal
 */
export interface ChangeProposal {
  tier: 1 | 2; // Tier 1: Admin approval, Tier 2: Auto-apply
  title: string;
  file: string;
  oldContent?: string;
  newContent?: string;
  reasoning: string;
  source: string; // Where this change came from (e.g., "Synthesizer report", "Simulator failure")
  metadata?: Record<string, any>;
}

/**
 * Propose a change to the system
 *
 * Tier 1 = Major changes (SOUL.md, protocol changes) - stages for approval
 * Tier 2 = Minor changes (tweaks, adjustments) - logs and applies
 */
export async function proposeChange(options: {
  tier: 1 | 2;
  title: string;
  file: string;
  oldContent?: string;
  newContent?: string;
  reasoning: string;
  source: string;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  applied?: boolean;
  stagedPath?: string;
  error?: string;
}> {
  try {
    const proposal: ChangeProposal = {
      tier: options.tier,
      title: options.title,
      file: options.file,
      oldContent: options.oldContent,
      newContent: options.newContent,
      reasoning: options.reasoning,
      source: options.source,
      metadata: options.metadata || {},
    };

    if (options.tier === 1) {
      // Tier 1: Stage proposal file for admin review
      const date = new Date().toISOString().split('T')[0];
      const filename = `PROPOSED_TIER1_${date}.md`;
      const path = `/nullclaw-data/workspace-engineer/${filename}`;

      // Read current content if trying to apply change
      let currentContent = '';
      if (options.newContent && existsSync(options.file)) {
        try {
          currentContent = readFileSync(options.file, 'utf-8');
        } catch {
          // File doesn't exist yet
        }
      }

      const proposalContent = generateProposalMarkdown(proposal, currentContent);

      writeFileSync(path, proposalContent, 'utf-8');

      return {
        success: true,
        applied: false,
        stagedPath: path,
      };
    } else {
      // Tier 2: Auto-apply the change
      if (options.newContent) {
        // Back up old content for revert capability
        let backedUp = false;
        if (existsSync(options.file)) {
          const backupPath = `${options.file}.backup.${Date.now()}`;
          const oldContent = readFileSync(options.file, 'utf-8');
          writeFileSync(backupPath, oldContent, 'utf-8');
          backedUp = true;
        }

        // Write new content
        writeFileSync(options.file, options.newContent, 'utf-8');

        return {
          success: true,
          applied: true,
          stagedPath: options.file,
        };
      } else {
        return {
          success: false,
          error: 'Tier 2 change must include newContent'
        };
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate markdown proposal for Tier 1 changes
 */
function generateProposalMarkdown(proposal: ChangeProposal, currentContent: string): string {
  const { tier, title, file, oldContent, newContent, reasoning, source, metadata } = proposal;

  let diff = '';
  if (oldContent && newContent) {
    // Simple diff representation
    diff = '```diff';
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    let i = 0;
    let j = 0;

    while (i < oldLines.length || j < newLines.length) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[j] || '';

      if (oldLine === newLine) {
        diff += `  ${oldLine}\n`;
        i++;
        j++;
      } else if (newLine.startsWith('+') || newLine.startsWith('-')) {
        diff += `\n--- Original had different structure ---\n`;
        // Skip detailed diff for now
        i = oldLines.length;
        j = newLines.length;
      } else {
        if (oldLine && j < newLines.length) {
          const found = newLines.slice(i).findIndex(l => l === oldLine);
          if (found !== -1) {
            diff += `- ${oldLine}\n`;
            for (let k = i; k < found; k++) {
              diff += `+ ${newLines[k]}\n`;
            }
            i++;
            j = found + 1;
          } else {
            diff += `- ${oldLine}\n`;
            i++;
          }
        } else if (newLine && i < oldLines.length) {
          diff += `+ ${newLine}\n`;
          j++;
        }
      }
    }

    if (oldContent.length === 0 && newContent.length > 0) {
      diff = `\n\`\`\`\nNew file (created):\n\`\`\`diff\n${newContent}\n\`\`\``;
    } else if (newContent.length === 0 && oldContent.length > 0) {
      diff = `\n\`\`\`\nFile deleted\n\`\`\``;
    } else {
      diff += '\n```\n';
    }
  } else {
    diff = '\n```\n[No diff - content not provided for preview]\n```\n';
  }

  return `# Tier 1 Change Proposal

## ${title}

**Source**: ${source}
**File**: \`${file}\`
**Date**: ${new Date().toISOString()}
**Metadata**: ${metadata ? JSON.stringify(metadata, null, 2) : 'None'}

---

## Reasoning

${reasoning}

---

## Proposed Changes

${diff}

---

## Review Instructions

1. Review the diff above
2. If approved:
   - Manually apply the changes to \`${file}\`
   - This file will be marked as applied
3. If rejected:
   - This proposal will be archived

**Important**: Tier 1 changes affect core identity or protocol. These require explicit approval before application.
`;
}

/**
 * Log a change to the change log in Postgres
 */
export async function logChange(options: {
  tier: 1 | 2;
  title: string;
  file: string;
  applied: boolean;
  reasoning: string;
  source: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    await pool.query(`
      INSERT INTO engineer_changes (tier, title, file, applied, reasoning, source, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [options.tier, options.title, options.file, options.applied, options.reasoning, options.source]);

    return { success: true };
  } catch (error: any) {
    // Table might not exist, that's ok
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Write engineer report to workspace
 */
export async function writeReport(report: {
  totalFindings: number;
  tier2Applied: Array<{ title: string; file: string; reasoning: string }>;
  tier1Staged: Array<{ title: string; file: string; reasoning: string }>;
  systemHealth: 'HEALTHY' | 'WATCH' | 'DEGRADED';
}): Promise<{
  success: boolean;
  path: string;
  error?: string;
}> {
  const path = '/nullclaw-data/workspace-engineer/ENGINEER_REPORT.md';

  try {
    const content = generateEngineerReport(report);
    writeFileSync(path, content, 'utf-8');
    return { success: true, path };
  } catch (error: any) {
    return {
      success: false,
      path,
      error: error.message,
    };
  }
}

/**
 * Generate engineer report markdown
 */
function generateEngineerReport(report: {
  totalFindings: number;
  tier2Applied: Array<{ title: string; file: string; reasoning: string }>;
  tier1Staged: Array<{ title: string; file: string; reasoning: string }>;
  systemHealth: 'HEALTHY' | 'WATCH' | 'DEGRADED';
}): string {
  const { totalFindings, tier2Applied, tier1Staged, systemHealth } = report;

  const healthIcon = systemHealth === 'HEALTHY' ? '✅' : systemHealth === 'WATCH' ? '⚠️' : '🔴';
  const healthColor = systemHealth === 'HEALTHY' ? 'green' : systemHealth === 'WATCH' ? 'orange' : 'red';

  let content = `# Engineer Agent Report

**Generated**: ${new Date().toISOString()}
**System Health**: ${healthIcon} ${systemHealth}

---

## Summary

- **Total Findings Reviewed**: ${totalFindings}
- **Tier 2 Changes Applied**: ${tier2Applied.length}
- **Tier 1 Proposals Staged**: ${tier1Staged.length}
- **Overall Assessment**: ${systemHealth}

`;

  if (tier2Applied.length > 0) {
    content += `## Tier 2 Changes Auto-Applied

`;
    for (const change of tier2Applied) {
      content += `### ${change.title}

**File**: \`${change.file}\`

**Reasoning**:
${change.reasoning}

---
`;
    }
  }

  if (tier1Staged.length > 0) {
    content += `## Tier 1 Proposals Staged for Review

`;
    for (const proposal of tier1Staged) {
      content += `### ${proposal.title}

**File**: \`${proposal.file}\`
**Status**: ⏳ Pending Review

**Reasoning**:
${proposal.reasoning}

See full proposal in \`PROPOSED_TIER1_YYYY-MM-DD.md\`

---
`;
    }
  }

  if (systemHealth !== 'HEALTHY') {
    content += `
## System Health Assessment

Based on the findings, the system is in **${systemHealth}** status. ${
      systemHealth === 'WATCH'
        ? 'Monitoring recommended. No critical issues detected.'
        : systemHealth === 'DEGRADED'
        ? 'Action required. Multiple Tier 1 changes proposed.'
        : ''
    }
`;
  }

  return content;
}

/**
 * Read workspace files for analysis
 */
export async function readWorkspaceFile(workspace: string, filename: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  try {
    const path = `/nullclaw-data/workspace-${workspace}/${filename}`;
    const content = readFileSync(path, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get recent simulator results for analysis
 */
export async function getSimulatorResults(hours: number = 24): Promise<{
  success: boolean;
  jobs: any[];
  error?: string;
}> {
  const pool = new Pool(process.env.DATABASE_URL || 'postgresql://nullclaw:nullclaw@100.85.130.20:5432/nullclaw');

  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const result = await pool.query(`
      SELECT * FROM simulator_jobs
      WHERE created_at >= $1
      ORDER BY created_at DESC
    `, [cutoffTime]);

    return { success: true, jobs: result.rows };
  } catch (error: any) {
    return {
      success: false,
      jobs: [],
      error: error.message,
    };
  } finally {
    await pool.end();
  }
}

// CLI entry point
const args = process.argv.slice(2);
const [command, ...params] = args;

async function main() {
  switch (command) {
    case 'propose-change':
      const tier = parseInt(params[0]) || 2;
      const result = await proposeChange({
        tier,
        title: params[1] || '',
        file: params[2] || '',
        reasoning: params[3] || '',
        source: 'CLI',
      });
      console.log(JSON.stringify(result, null, 2));
      break;

    default:
      console.error('Unknown command:', command);
      console.log('Available commands: propose-change');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default {
  proposeChange,
  logChange,
  writeReport,
  readWorkspaceFile,
  getSimulatorResults,
  ChangeProposal,
};
