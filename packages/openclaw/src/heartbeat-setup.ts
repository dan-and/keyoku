/**
 * Auto-generates HEARTBEAT.md so that OpenClaw's heartbeat runner
 * actually fires the heartbeat (empty file = skip).
 *
 * Preserves existing user content — appends keyoku instructions as
 * an addendum rather than overwriting.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PluginApi } from './types.js';

const HEARTBEAT_FILENAME = 'HEARTBEAT.md';

const KEYOKU_SECTION_MARKER = '<!-- keyoku-heartbeat-start -->';
const KEYOKU_SECTION_END = '<!-- keyoku-heartbeat-end -->';

const KEYOKU_HEARTBEAT_INSTRUCTIONS = `## Keyoku Memory Heartbeat

You have been checked in on. Your memory system has reviewed your recent activity and surfaced anything that needs your attention. The signals are injected into your context automatically — look for the <heartbeat-signals> block.

### How to respond

IMPORTANT: If the signals contain \`should_act: true\` or a "Tell the User" section with ANY content, you MUST write a message to the user. Do NOT reply HEARTBEAT_OK in that case. Say something — even one sentence is fine.

1. Read the signals carefully. Check urgency, mode, and should_act.
2. If \`should_act\` is true — you MUST send a message. Use the "Tell the User" or "Action Brief" section as guidance for what to say. Keep it natural and brief.
3. If mode is \`act\` — take action immediately. Do what the signal says.
4. If mode is \`suggest\` and urgency is not \`none\` — surface the suggestion naturally.
5. ONLY reply HEARTBEAT_OK if \`should_act\` is false AND there is truly nothing in the signals worth mentioning.

Do not repeat old tasks from prior conversations. Only act on what the signals say right now.`;

const HEARTBEAT_TEMPLATE = `# Heartbeat Check

${KEYOKU_SECTION_MARKER}
${KEYOKU_HEARTBEAT_INSTRUCTIONS}
${KEYOKU_SECTION_END}
`;

/**
 * Check if the file has meaningful user content beyond headings and whitespace.
 */
function hasUserContent(content: string): boolean {
  // Strip out the keyoku section to check if there's OTHER content
  const withoutKeyoku = content
    .replace(new RegExp(`${escapeRegex(KEYOKU_SECTION_MARKER)}[\\s\\S]*?${escapeRegex(KEYOKU_SECTION_END)}`, 'g'), '')
    .trim();

  return withoutKeyoku
    .split('\n')
    .some((line: string) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('#') && trimmed !== '---';
    });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ensure HEARTBEAT.md exists with keyoku instructions.
 * - No file → write full template
 * - File with no user content → write full template
 * - File with user content but no keyoku section → append keyoku section
 * - File already has keyoku section → update it in place
 */
export function ensureHeartbeatMd(api: PluginApi): void {
  try {
    const heartbeatPath = join(api.resolvePath('.'), HEARTBEAT_FILENAME);

    if (!existsSync(heartbeatPath)) {
      writeFileSync(heartbeatPath, HEARTBEAT_TEMPLATE, 'utf-8');
      api.logger.info(`keyoku: created ${HEARTBEAT_FILENAME} for heartbeat support`);
      return;
    }

    const content = readFileSync(heartbeatPath, 'utf-8');

    // Already has keyoku section — update it in place
    if (content.includes(KEYOKU_SECTION_MARKER)) {
      const updated = content.replace(
        new RegExp(`${escapeRegex(KEYOKU_SECTION_MARKER)}[\\s\\S]*?${escapeRegex(KEYOKU_SECTION_END)}`),
        `${KEYOKU_SECTION_MARKER}\n${KEYOKU_HEARTBEAT_INSTRUCTIONS}\n${KEYOKU_SECTION_END}`,
      );
      if (updated !== content) {
        writeFileSync(heartbeatPath, updated, 'utf-8');
        api.logger.info(`keyoku: updated keyoku section in ${HEARTBEAT_FILENAME}`);
      }
      return;
    }

    // Has user content but no keyoku section — append
    if (hasUserContent(content)) {
      const addendum = `\n\n---\n\n${KEYOKU_SECTION_MARKER}\n${KEYOKU_HEARTBEAT_INSTRUCTIONS}\n${KEYOKU_SECTION_END}\n`;
      writeFileSync(heartbeatPath, content.trimEnd() + addendum, 'utf-8');
      api.logger.info(`keyoku: appended keyoku section to existing ${HEARTBEAT_FILENAME}`);
      return;
    }

    // No meaningful content — write full template
    writeFileSync(heartbeatPath, HEARTBEAT_TEMPLATE, 'utf-8');
    api.logger.info(`keyoku: created ${HEARTBEAT_FILENAME} for heartbeat support`);
  } catch (err) {
    api.logger.warn(`keyoku: could not create ${HEARTBEAT_FILENAME}: ${String(err)}`);
  }
}
