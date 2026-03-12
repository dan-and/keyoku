/**
 * CLI subcommand registration for memory management.
 * Registers `memory` command with search, list, stats, clear subcommands.
 */

import { join } from 'node:path';
import type { KeyokuClient } from '@keyoku/memory';
import type { PluginApi, PluginLogger } from './types.js';
import { formatMemoryList } from './context.js';
import { importMemoryFiles } from './migration.js';
import { migrateVectorStore, migrateAllVectorStores, discoverVectorDbs } from './migrate-vector-store.js';

// Minimal Commander-like interface for chaining
interface CommandChain {
  description(desc: string): CommandChain;
  command(name: string): CommandChain;
  argument(name: string, desc: string): CommandChain;
  option(flags: string, desc: string, defaultVal?: string): CommandChain;
  action(fn: (...args: unknown[]) => Promise<void> | void): CommandChain;
}

export function registerCli(api: PluginApi, client: KeyokuClient, entityId: string): void {
  api.registerCli(
    ({ program }: { program: unknown; logger: PluginLogger }) => {
      const prog = program as CommandChain;
      const memory = prog.command('memory').description('Keyoku memory commands');

      memory
        .command('search')
        .description('Search memories')
        .argument('<query>', 'Search query')
        .option('--limit <n>', 'Max results', '5')
        .action(async (query: unknown, opts: unknown) => {
          const q = query as string;
          const limit = parseInt((opts as { limit: string }).limit, 10);
          const results = await client.search(entityId, q, { limit });

          if (results.length === 0) {
            console.log('No matching memories found.');
            return;
          }

          for (const r of results) {
            console.log(`[${(r.similarity * 100).toFixed(0)}%] ${r.memory.content}`);
          }
        });

      memory
        .command('list')
        .description('List recent memories')
        .option('--limit <n>', 'Max results', '20')
        .action(async (opts: unknown) => {
          const limit = parseInt((opts as { limit: string }).limit, 10);
          const memories = await client.listMemories(entityId, limit);
          console.log(formatMemoryList(memories));
        });

      memory
        .command('stats')
        .description('Show memory statistics')
        .action(async () => {
          const stats = await client.getStats(entityId);
          console.log(`Total: ${stats.total_memories} | Active: ${stats.active_memories}`);
          console.log(`By type: ${JSON.stringify(stats.by_type)}`);
          console.log(`By state: ${JSON.stringify(stats.by_state)}`);
        });

      memory
        .command('clear')
        .description('Delete all memories for this entity')
        .action(async () => {
          await client.deleteAllMemories(entityId);
          console.log('All memories cleared.');
        });

      memory
        .command('import')
        .description('Import OpenClaw memory files (MEMORY.md, memory/*.md) into Keyoku')
        .option('--dir <path>', 'Workspace directory containing memory files', '.')
        .option('--dry-run', 'Show what would be imported without storing')
        .action(async (opts: unknown) => {
          const options = opts as { dir: string; dryRun?: boolean };
          const result = await importMemoryFiles({
            client,
            entityId,
            workspaceDir: options.dir,
            dryRun: options.dryRun,
            logger: console,
          });
          console.log(
            `\nImport complete: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`,
          );
        });
      memory
        .command('migrate')
        .description('Migrate OpenClaw vector store (SQLite) into Keyoku')
        .option('--agent-id <id>', 'Agent ID to scope the migration')
        .option('--sqlite <path>', 'Path to a specific OpenClaw .sqlite file')
        .option('--include-markdown', 'Also import MEMORY.md and memory/*.md files')
        .option('--dry-run', 'Show what would be imported without storing')
        .action(async (opts: unknown) => {
          const options = opts as {
            agentId?: string;
            sqlite?: string;
            includeMarkdown?: boolean;
            dryRun?: boolean;
          };

          const home = process.env.HOME ?? '';

          // Vector store migration
          if (options.sqlite) {
            // Migrate a specific SQLite file
            const result = await migrateVectorStore({
              client,
              entityId,
              sqlitePath: options.sqlite,
              agentId: options.agentId,
              dryRun: options.dryRun,
              logger: console,
            });
            console.log(
              `\nVector migration: ${result.totalChunks} total, ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`,
            );
          } else {
            // Auto-discover OpenClaw memory directory
            const memoryDir = join(home, '.openclaw', 'memory');
            const dbs = discoverVectorDbs(memoryDir);

            if (dbs.length === 0) {
              console.log('No OpenClaw vector stores found at ~/.openclaw/memory/*.sqlite');
            } else {
              const result = await migrateAllVectorStores({
                client,
                entityId,
                memoryDir,
                agentId: options.agentId,
                dryRun: options.dryRun,
                logger: console,
              });
              console.log(
                `\nVector migration: ${result.totalChunks} total, ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`,
              );
            }
          }

          // Optionally also import markdown files
          if (options.includeMarkdown) {
            const workspaceDir = join(home, '.openclaw');
            const mdResult = await importMemoryFiles({
              client,
              entityId,
              workspaceDir,
              agentId: options.agentId,
              dryRun: options.dryRun,
              logger: console,
            });
            console.log(
              `Markdown import: ${mdResult.imported} imported, ${mdResult.skipped} skipped, ${mdResult.errors} errors`,
            );
          }
        });
    },
    { commands: ['memory'] },
  );
}
