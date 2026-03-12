/**
 * One-command installer for the Keyoku OpenClaw plugin.
 *
 * `npx @keyoku/openclaw init`
 *
 * 1. Detects OpenClaw config
 * 2. Downloads keyoku-engine binary if missing
 * 3. Registers plugin in openclaw.json
 * 4. Preserves existing HEARTBEAT.md
 * 5. Offers migration of existing OpenClaw memories
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
import { KeyokuClient } from '@keyoku/memory';
import { importMemoryFiles } from './migration.js';
import { migrateAllVectorStores, discoverVectorDbs } from './migrate-vector-store.js';

const HOME = process.env.HOME ?? '';
const OPENCLAW_CONFIG_PATH = join(HOME, '.openclaw', 'openclaw.json');
const KEYOKU_BIN_DIR = join(HOME, '.keyoku', 'bin');
const KEYOKU_BIN_PATH = join(KEYOKU_BIN_DIR, 'keyoku');
const OPENCLAW_MEMORY_DIR = join(HOME, '.openclaw', 'memory');

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { enabled: boolean; config?: Record<string, unknown> }>;
    slots?: Record<string, string>;
  };
  [key: string]: unknown;
}

function log(msg: string): void {
  console.log(`  ${msg}`);
}

function success(msg: string): void {
  console.log(`  [OK] ${msg}`);
}

function warn(msg: string): void {
  console.log(`  [!] ${msg}`);
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`  ${question} `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Detect platform and architecture for binary download.
 */
function getPlatformInfo(): { os: string; arch: string } {
  const platform = process.platform;
  const arch = process.arch;

  const osMap: Record<string, string> = {
    darwin: 'darwin',
    linux: 'linux',
    win32: 'windows',
  };

  const archMap: Record<string, string> = {
    x64: 'amd64',
    arm64: 'arm64',
  };

  return {
    os: osMap[platform] ?? platform,
    arch: archMap[arch] ?? arch,
  };
}

/**
 * Download the keyoku-engine binary from GitHub releases.
 */
async function downloadBinary(): Promise<boolean> {
  const { os, arch } = getPlatformInfo();
  const binaryName = os === 'windows' ? 'keyoku-server.exe' : 'keyoku-server';
  const assetName = `keyoku-server-${os}-${arch}${os === 'windows' ? '.exe' : ''}`;

  log(`Downloading keyoku-engine for ${os}/${arch}...`);

  try {
    // Get latest release info from GitHub API
    const releaseRes = await fetch(
      'https://api.github.com/repos/keyoku-ai/keyoku-engine/releases/latest',
      { headers: { Accept: 'application/vnd.github.v3+json' } },
    );

    if (!releaseRes.ok) {
      warn(`Could not fetch latest release: ${releaseRes.status} ${releaseRes.statusText}`);
      return false;
    }

    const release = await releaseRes.json() as {
      tag_name: string;
      assets: Array<{ name: string; browser_download_url: string }>;
    };

    const asset = release.assets.find((a) => a.name === assetName);
    if (!asset) {
      warn(`No binary found for ${os}/${arch} in release ${release.tag_name}`);
      warn(`Available assets: ${release.assets.map((a) => a.name).join(', ')}`);
      return false;
    }

    log(`Downloading ${asset.name} from release ${release.tag_name}...`);

    // Download the binary
    const downloadRes = await fetch(asset.browser_download_url);
    if (!downloadRes.ok || !downloadRes.body) {
      warn(`Download failed: ${downloadRes.status}`);
      return false;
    }

    // Ensure directory exists
    mkdirSync(KEYOKU_BIN_DIR, { recursive: true });

    // Stream to file
    const destPath = KEYOKU_BIN_PATH;
    const fileStream = createWriteStream(destPath);
    // @ts-expect-error — Node fetch body is a ReadableStream, pipeline handles it
    await pipeline(downloadRes.body, fileStream);

    // Make executable
    if (os !== 'windows') {
      chmodSync(destPath, 0o755);
    }

    success(`Binary installed at ${destPath}`);
    return true;
  } catch (err) {
    warn(`Failed to download binary: ${String(err)}`);
    return false;
  }
}

/**
 * Read and parse the OpenClaw config file.
 */
function readOpenClawConfig(): OpenClawConfig | null {
  if (!existsSync(OPENCLAW_CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(OPENCLAW_CONFIG_PATH, 'utf-8')) as OpenClawConfig;
  } catch {
    return null;
  }
}

/**
 * Write the OpenClaw config file.
 */
function writeOpenClawConfig(config: OpenClawConfig): void {
  writeFileSync(OPENCLAW_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Main init function — orchestrates the full setup.
 */
export async function init(): Promise<void> {
  console.log('\n  Keyoku OpenClaw Plugin — Setup\n');

  // Step 1: Detect OpenClaw
  const config = readOpenClawConfig();
  if (!config) {
    warn(`OpenClaw config not found at ${OPENCLAW_CONFIG_PATH}`);
    warn('Make sure OpenClaw is installed first: https://openclaw.dev');
    process.exit(1);
  }
  success('OpenClaw config detected');

  // Step 2: Check if already installed
  const entries = config.plugins?.entries ?? {};
  if (entries['keyoku-memory']?.enabled) {
    success('Keyoku plugin already registered in OpenClaw config');
  } else {
    // Step 3: Ensure binary exists
    if (existsSync(KEYOKU_BIN_PATH)) {
      success(`Keyoku binary found at ${KEYOKU_BIN_PATH}`);
    } else {
      log('Keyoku binary not found — downloading...');
      const downloaded = await downloadBinary();
      if (!downloaded) {
        warn('Could not download binary. You can install it manually:');
        warn('  Visit: https://github.com/keyoku-ai/keyoku-engine/releases');
        warn(`  Place the binary at: ${KEYOKU_BIN_PATH}`);
        const proceed = await prompt('Continue without binary? (y/n)');
        if (proceed !== 'y') {
          process.exit(1);
        }
      }
    }

    // Step 4: Register plugin in config
    if (!config.plugins) config.plugins = {};
    if (!config.plugins.entries) config.plugins.entries = {};
    if (!config.plugins.slots) config.plugins.slots = {};

    config.plugins.entries['keyoku-memory'] = { enabled: true, config: {} };
    config.plugins.slots['memory'] = 'keyoku-memory';

    writeOpenClawConfig(config);
    success('Plugin registered in openclaw.json');
  }

  // Step 5: Check for existing memories to migrate
  const memoryMdPath = join(HOME, '.openclaw', 'MEMORY.md');
  const hasMemoryMd = existsSync(memoryMdPath);
  const vectorDbs = discoverVectorDbs(OPENCLAW_MEMORY_DIR);
  const hasVectorStores = vectorDbs.length > 0;

  if (hasMemoryMd || hasVectorStores) {
    console.log('');
    log('Found existing OpenClaw memories:');
    if (hasMemoryMd) log(`  - MEMORY.md`);
    if (hasVectorStores) log(`  - ${vectorDbs.length} vector store(s) in ~/.openclaw/memory/`);

    const migrate = await prompt('Migrate existing memories into Keyoku? (y/n)');

    if (migrate === 'y') {
      log('Starting migration...');

      const client = new KeyokuClient({ baseUrl: 'http://localhost:18900' });
      const entityId = 'default';

      // Migrate markdown files
      if (hasMemoryMd) {
        try {
          const mdResult = await importMemoryFiles({
            client,
            entityId,
            workspaceDir: join(HOME, '.openclaw'),
            logger: console,
          });
          success(`Markdown: ${mdResult.imported} imported, ${mdResult.skipped} skipped`);
        } catch (err) {
          warn(`Markdown migration failed: ${String(err)}`);
          warn('Make sure Keyoku is running (it will auto-start when OpenClaw loads the plugin)');
        }
      }

      // Migrate vector stores
      if (hasVectorStores) {
        try {
          const vsResult = await migrateAllVectorStores({
            client,
            entityId,
            memoryDir: OPENCLAW_MEMORY_DIR,
            logger: console,
          });
          success(`Vector store: ${vsResult.imported} imported, ${vsResult.skipped} skipped`);
        } catch (err) {
          warn(`Vector store migration failed: ${String(err)}`);
        }
      }
    } else {
      log('Skipping migration. You can run it later with: openclaw memory migrate');
    }
  }

  // Done
  console.log('\n  Setup complete!\n');
  log('The plugin will auto-start Keyoku when OpenClaw loads.');
  log('Run `openclaw memory stats` to check your memory status.');
  log('Run `openclaw memory migrate` to migrate data later.\n');
}
