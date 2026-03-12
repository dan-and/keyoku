/**
 * Vector store migration — imports OpenClaw's SQLite-based vector store into Keyoku.
 *
 * OpenClaw stores memory chunks in SQLite at ~/.openclaw/memory/<agentId>.sqlite
 * with a `chunks` table (id, path, source, text, embedding, start_line, end_line).
 *
 * This migrator reads the text from each chunk, deduplicates against existing
 * Keyoku memories, and stores each unique chunk. Embeddings are NOT migrated —
 * Keyoku re-embeds with its own model.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { KeyokuClient } from '@keyoku/memory';

// node:sqlite (DatabaseSync) requires Node >= 22.5.0
// We use dynamic import so the rest of the plugin works on Node 20+
async function openSqlite(path: string): Promise<{ all(sql: string): Record<string, unknown>[]; close(): void }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(path, { open: true } as never);
    return {
      all(sql: string) {
        return db.prepare(sql).all() as Record<string, unknown>[];
      },
      close() {
        db.close();
      },
    };
  } catch {
    throw new Error(
      'Vector store migration requires Node.js >= 22.5.0 (for node:sqlite). ' +
      'Please upgrade Node.js or export your OpenClaw SQLite data manually.',
    );
  }
}

export interface VectorMigrationResult {
  totalChunks: number;
  imported: number;
  skipped: number;
  errors: number;
}

interface ChunkRow {
  id: string;
  path: string;
  source: string;
  text: string;
  start_line: number | null;
  end_line: number | null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Discover OpenClaw SQLite memory databases.
 */
export function discoverVectorDbs(memoryDir: string): string[] {
  if (!existsSync(memoryDir)) return [];
  return readdirSync(memoryDir)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => join(memoryDir, f));
}

/**
 * Migrate a single OpenClaw SQLite vector store into Keyoku.
 */
export async function migrateVectorStore(params: {
  client: KeyokuClient;
  entityId: string;
  sqlitePath: string;
  agentId?: string;
  dryRun?: boolean;
  batchSize?: number;
  delayMs?: number;
  logger?: { info: (msg: string) => void; warn: (msg: string) => void };
}): Promise<VectorMigrationResult> {
  const {
    client,
    entityId,
    sqlitePath,
    agentId,
    dryRun = false,
    batchSize = 20,
    delayMs = 100,
    logger = console,
  } = params;

  const result: VectorMigrationResult = { totalChunks: 0, imported: 0, skipped: 0, errors: 0 };

  if (!existsSync(sqlitePath)) {
    logger.warn(`SQLite file not found: ${sqlitePath}`);
    return result;
  }

  const dbName = basename(sqlitePath, '.sqlite');
  logger.info(`Migrating vector store: ${dbName} (${sqlitePath})`);

  const db = await openSqlite(sqlitePath);

  try {
    // Check if chunks table exists
    const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='chunks'");
    if (tables.length === 0) {
      logger.warn(`No 'chunks' table found in ${dbName} — skipping`);
      return result;
    }

    // Read all chunks
    const rows = db.all(
      'SELECT id, path, source, text, start_line, end_line FROM chunks ORDER BY rowid DESC',
    ) as unknown as ChunkRow[];
    result.totalChunks = rows.length;

    logger.info(`Found ${rows.length} chunks in ${dbName}`);

    let batchCount = 0;
    for (const row of rows) {
      // Skip very short chunks
      if (!row.text || row.text.trim().length < 10) {
        result.skipped++;
        continue;
      }

      // Build tagged content with source context
      const locationInfo = row.start_line != null
        ? ` (lines ${row.start_line}-${row.end_line})`
        : '';
      const sourceInfo = row.path || row.source || dbName;
      const taggedText = `[Migrated from OpenClaw vector store — ${sourceInfo}${locationInfo}]\n${row.text}`;

      if (dryRun) {
        logger.info(`[dry-run] Would import: ${row.text.slice(0, 80)}...`);
        result.imported++;
        continue;
      }

      // Dedup check — search for similar content
      try {
        const queryText = row.text.slice(0, 100);
        const existing = await client.search(entityId, queryText, {
          limit: 1,
          min_score: 0.95,
        });

        if (existing.length > 0) {
          result.skipped++;
          continue;
        }
      } catch {
        // Search failed — proceed with import anyway
      }

      // Store the memory
      try {
        await client.remember(entityId, taggedText, {
          agent_id: agentId,
          source: 'migration:openclaw-vector',
        });
        result.imported++;
        logger.info(`Imported: ${row.text.slice(0, 60)}...`);
      } catch (err) {
        logger.warn(`Failed to store chunk ${row.id}: ${String(err)}`);
        result.errors++;
      }

      // Rate limit per batch
      batchCount++;
      if (batchCount >= batchSize) {
        await delay(delayMs);
        batchCount = 0;
      }
    }
  } finally {
    db.close();
  }

  return result;
}

/**
 * Migrate all OpenClaw vector stores found in a directory.
 */
export async function migrateAllVectorStores(params: {
  client: KeyokuClient;
  entityId: string;
  memoryDir: string;
  agentId?: string;
  dryRun?: boolean;
  logger?: { info: (msg: string) => void; warn: (msg: string) => void };
}): Promise<VectorMigrationResult> {
  const { client, entityId, memoryDir, agentId, dryRun, logger = console } = params;
  const totals: VectorMigrationResult = { totalChunks: 0, imported: 0, skipped: 0, errors: 0 };

  const dbFiles = discoverVectorDbs(memoryDir);
  if (dbFiles.length === 0) {
    logger.info('No OpenClaw SQLite vector stores found.');
    return totals;
  }

  logger.info(`Found ${dbFiles.length} vector store(s) to migrate.`);

  for (const dbPath of dbFiles) {
    const result = await migrateVectorStore({
      client,
      entityId,
      sqlitePath: dbPath,
      agentId,
      dryRun,
      logger,
    });

    totals.totalChunks += result.totalChunks;
    totals.imported += result.imported;
    totals.skipped += result.skipped;
    totals.errors += result.errors;
  }

  return totals;
}
