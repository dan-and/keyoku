<div align="center">

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
    <img alt="keyoku" src="assets/banner-light.svg" width="800">
  </picture>

  <p>
    <strong>Supercharge your OpenClaw assistant with persistent memory.</strong><br>
    <sub>Your agent remembers everything, learns from every conversation, and acts on what it knows — automatically.</sub>
  </p>

  <p>
    <a href="#get-started">Get Started</a> &bull;
    <a href="#what-your-agent-gets">What Your Agent Gets</a> &bull;
    <a href="#the-heartbeat">The Heartbeat</a> &bull;
    <a href="#autonomy-levels">Autonomy Levels</a>
  </p>

  [![npm](https://img.shields.io/npm/v/@keyoku/openclaw?label=%40keyoku%2Fopenclaw&style=flat-square&color=6366f1)](https://www.npmjs.com/package/@keyoku/openclaw)
  [![npm](https://img.shields.io/npm/v/@keyoku/memory?label=%40keyoku%2Fmemory&style=flat-square&color=6366f1)](https://www.npmjs.com/package/@keyoku/memory)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

</div>

<br>

## Why Keyoku?

OpenClaw is powerful out of the box. But its built-in memory and heartbeat have real limits. Keyoku replaces both with something dramatically better.

### The memory problem

OpenClaw's default memory is a **flat file** — `MEMORY.md`. Your agent can search it with `memory_search`, but:

- **You have to ask.** The agent only looks at memory when it explicitly calls the search tool. If it doesn't think to search, it doesn't remember.
- **You can't write back.** There's no way for the agent to save new memories during a conversation. Facts are lost when the session ends unless you manually edit the file.
- **No understanding of meaning.** Search is keyword + vector similarity on text chunks. It doesn't know that "prefers TypeScript" and "likes TS" are the same thing. No deduplication, no conflict detection, no decay.
- **Limited results.** Capped at 6 snippets, ~700 characters each. If the answer is buried in memory #47, your agent will never find it.

With Keyoku, memory is **automatic, semantic, and alive**:

- **Auto-recall** — before every single response, Keyoku searches memory for anything relevant and silently injects it into the prompt. Your agent just *knows* things. No tool call needed.
- **Auto-capture** — every message pair (what you said + what the agent responded) is analyzed in real-time. Important facts are extracted and stored automatically. No manual edits.
- **Semantic engine** — Keyoku understands meaning. It deduplicates ("prefers TypeScript" won't be stored twice), detects conflicts (you changed your mind → old memory updated), and decays stale info (unused facts fade so fresh knowledge surfaces first).
- **No limits** — HNSW vector index with full-text fallback. No capped snippets. The agent gets complete memories with metadata.

### The heartbeat problem

OpenClaw's default heartbeat reads a **static `HEARTBEAT.md` file** every 30 minutes. That's it.

- **No data.** The file contains tasks you wrote manually. The agent reads them, but has zero context about *what's actually happening* — no memory awareness, no deadline tracking, no sentiment analysis.
- **Stateless.** Each heartbeat run is isolated. The agent doesn't remember what it checked last time. It can't track trends or patterns across heartbeats.
- **Guesswork.** The agent reads "Check for pending approvals" and has to figure out on its own what that means, what to look for, and whether anything is actually pending. Usually it just replies `HEARTBEAT_OK`.
- **No autonomy control.** The agent either acts or doesn't. No structured levels of freedom.

With Keyoku, heartbeat is **memory-aware, structured, and intelligent**:

- **10 signal categories** scanned simultaneously — scheduled tasks, deadlines, pending work, conflicts, goal progress, session continuity, sentiment trends, relationship alerts, knowledge gaps, and behavioral patterns.
- **LLM analysis** — when signals are detected, an LLM evaluates the situation and generates a structured action brief with specific recommendations and user-facing messages.
- **Memory-driven** — the heartbeat doesn't read a file. It queries your agent's actual memory store. If you mentioned a Friday deadline two weeks ago, the heartbeat knows about it.
- **Three autonomy levels** — `observe` (log only), `suggest` (recommend to user), `act` (execute immediately). You control how much freedom the agent has.
- **Idle check-ins** — when nothing is urgent, Keyoku notices the silence and triggers personalized check-ins using what it knows about you. Not generic "how are you?" but "Hey, how did that API migration go?"

### Side-by-side

<table>
<tr>
<th width="33%"></th>
<th width="33%">OpenClaw Default</th>
<th width="33%">With Keyoku</th>
</tr>
<tr>
<td><strong>Memory storage</strong></td>
<td>Flat markdown file (MEMORY.md)</td>
<td>Semantic engine with SQLite + HNSW vector index</td>
</tr>
<tr>
<td><strong>Recall</strong></td>
<td>Manual — agent must call <code>memory_search</code></td>
<td>Automatic — injected before every prompt</td>
</tr>
<tr>
<td><strong>Capture</strong></td>
<td>None — no write API during sessions</td>
<td>Automatic — every message pair analyzed and stored</td>
</tr>
<tr>
<td><strong>Deduplication</strong></td>
<td>None — same fact stored repeatedly</td>
<td>Hash + semantic — "likes TS" won't duplicate "prefers TypeScript"</td>
</tr>
<tr>
<td><strong>Conflict detection</strong></td>
<td>None — contradictions pile up</td>
<td>Automatic — old fact updated when you change your mind</td>
</tr>
<tr>
<td><strong>Memory decay</strong></td>
<td>None — stale info treated same as fresh</td>
<td>Automatic — unused memories fade, recent knowledge surfaces first</td>
</tr>
<tr>
<td><strong>Search results</strong></td>
<td>6 snippets, ~700 chars each</td>
<td>Full memories with metadata, configurable top-K</td>
</tr>
<tr>
<td><strong>Heartbeat input</strong></td>
<td>Static HEARTBEAT.md file</td>
<td>10 signal categories from actual memory data</td>
</tr>
<tr>
<td><strong>Heartbeat intelligence</strong></td>
<td>Agent reads file and guesses</td>
<td>LLM analysis with structured action briefs</td>
</tr>
<tr>
<td><strong>Heartbeat state</strong></td>
<td>Stateless — no memory of previous runs</td>
<td>Memory-aware — tracks trends, patterns, and history</td>
</tr>
<tr>
<td><strong>Autonomy control</strong></td>
<td>None</td>
<td>Three levels: observe, suggest, act</td>
</tr>
<tr>
<td><strong>Scheduling</strong></td>
<td>Basic cron events</td>
<td>Cron-tagged memories with acknowledgment tracking</td>
</tr>
<tr>
<td><strong>Multi-agent</strong></td>
<td>Isolated per agent</td>
<td>Private, team, and global memory scopes</td>
</tr>
</table>

---

## Get Started

### 1. Install the plugin

```bash
npm install @keyoku/openclaw
```

### 2. Add it to your OpenClaw config

```typescript
import keyokuMemory from '@keyoku/openclaw';

const config = {
  plugins: {
    'keyoku-memory': keyokuMemory()  // that's it — all features are on by default
  },
  slots: {
    memory: 'keyoku-memory'
  }
};
```

That's all you need. Everything is enabled by default — auto-recall, auto-capture, heartbeat, incremental learning, and all 7 memory tools.

### 3. Make sure keyoku-engine is running

The plugin connects to [**keyoku-engine**](https://github.com/keyoku-ai/keyoku-engine), which runs locally on your machine. It stores everything in SQLite — no cloud databases, no API keys for storage, your data stays on your device.

```
Your Agent ──▶ @keyoku/openclaw ──▶ keyoku-engine ──▶ SQLite + HNSW
               (plugin)              (local server)     (your machine)
```

> [!NOTE]
> keyoku-engine defaults to `http://localhost:18900`. See the [keyoku-engine repo](https://github.com/keyoku-ai/keyoku-engine) for setup instructions.

---

## What Your Agent Gets

Once the plugin is registered, your agent gains these capabilities with **zero additional code**:

### Auto-Recall

Before every response, Keyoku searches your agent's memory for anything relevant to what you're talking about and silently injects it into the prompt. Your agent doesn't "look up" memories — it just *knows* things about you, like a person would.

> **Example:** You mentioned you prefer dark mode three weeks ago. Today you ask about UI settings — your agent already knows your preference without you saying anything.

### Auto-Capture

Every message you exchange is analyzed in real-time. Keyoku extracts the important parts — preferences, decisions, facts, relationships — and stores them as discrete memories. It captures the *pair* (what you said + what the agent responded) for full context.

The engine automatically:
- **Deduplicates** — won't store the same fact twice (checks by hash and meaning)
- **Detects conflicts** — if you change your mind, the old memory gets updated
- **Decays stale info** — old, unused memories fade over time so the freshest knowledge surfaces first

### 7 Memory Tools

Your agent can also *actively* use memory through these tools (registered automatically):

| Tool | What it does |
|------|-------------|
| `memory_search` | Find memories by meaning — "what does this user like?" |
| `memory_store` | Save something important for later |
| `memory_get` | Read a specific memory |
| `memory_forget` | Delete something that's no longer true |
| `memory_stats` | See how many memories exist, by type and state |
| `schedule_create` | Set a recurring reminder (daily, weekly, monthly, or custom cron) |
| `schedule_list` | View all active schedules |

---

## The Heartbeat

This is where Keyoku gets powerful.

Most memory systems are passive — they store things and retrieve them when asked. Keyoku's heartbeat is **active**. On every heartbeat tick, your agent doesn't just sit idle. It reviews everything it knows and decides if there's something it should do *right now*.

### How it works

1. **OpenClaw fires a heartbeat tick** (every few minutes by default)
2. **Keyoku scans all memory signals** — 12 SQL-driven checks, zero LLM tokens
3. **If something needs attention**, Keyoku runs an LLM analysis enriched with knowledge graph context and generates an action brief
4. **The agent receives structured signals** telling it what to do, what to say, and how urgent it is

### What the heartbeat detects

| Signal | What it catches |
|--------|----------------|
| **Scheduled tasks** | Recurring reminders that are due (daily standup, weekly report, etc.) |
| **Deadlines** | Memories with expiration dates that are approaching |
| **Pending work** | Unfinished tasks or commitments the agent made |
| **Conflicts** | Contradictory information that needs resolution |
| **Goal progress** | How far along tracked goals are, with time remaining |
| **Session continuity** | Interrupted conversations that should be resumed |
| **Sentiment trends** | Shifts in user mood across recent conversations |
| **Relationship alerts** | People or contacts the user hasn't engaged with in a while |
| **Knowledge gaps** | Questions the agent couldn't answer — flagged for follow-up |
| **Behavioral patterns** | Recurring habits or preferences detected over time |
| **Stale monitors** | Tracked plans that haven't been touched in 24h |
| **Decaying memories** | Important memories approaching decay threshold |

### The Brain

The heartbeat isn't just a signal scanner — it's a decision engine that uses your agent's full cognitive system:

- **Combines weak signals.** Five "meh" signals that individually don't matter can combine to trigger action. Your agent doesn't miss things just because no single signal was urgent enough.

- **Learns from silence.** If you ignore nudges, the system notices. Response rates below 30% trigger 3x longer cooldowns. Below 10%, it basically stops bothering you until something critical happens.

- **Won't repeat itself.** Same topic won't come up again just because the underlying memory changed. The brain tracks which *entities* (people, projects, topics) it already brought up.

- **Understands urgency as a gradient.** A deadline in 45 minutes isn't the same as one tomorrow. The closer it gets, the more urgently it's treated — and critical deadlines bypass quiet hours.

- **Notices when things improve.** If a goal goes from "at risk" to "on track," or someone you lost touch with messages again, the brain surfaces it. Agents that only nag feel robotic. Agents that acknowledge progress feel human.

- **Matches your patterns.** If you always do code reviews on Tuesdays, the brain knows. It'll surface relevant plans and memories on the right day instead of generic check-ins.

- **Uses the knowledge graph.** Before asking the LLM what to say, the brain enriches every signal with entity relationships — so the LLM knows that "Alice" is a person who works at ClientCo and is connected to the Q3 launch plan, not just a name in a memory.

### What your agent actually sees

A `HEARTBEAT.md` file is static. It tells the agent to "check in" but gives it no context. The agent has to guess.

Keyoku injects **real, structured signals** directly into the agent's context:

```
<heartbeat-signals>
## Action Brief
The user has a project deadline in 2 days and hasn't mentioned it recently.

## Suggested Actions
- Remind the user about the Friday deadline for the API migration
- Ask if they need help prioritizing remaining tasks

## Tell the User
Hey — just a heads up, your API migration deadline is this Friday.
Looks like there are still 3 open tasks. Want me to help prioritize?

## Knowledge Graph Context
- Alice (person) -[works_at]-> ClientCo (org)
- API Migration (project) -[assigned_to]-> Alice (person)
- API Migration (project) -[blocked_by]-> Auth Refactor (project)

## What You Know
- User is working on API migration from REST to GraphQL
- Deadline is Friday March 14th
- Prefers to tackle hardest tasks first
- Last mentioned the project 4 days ago

## Positive Changes
- [goal_improved] "Auth Refactor" moved from at_risk to on_track

Urgency: soon | Mode: suggest
</heartbeat-signals>
```

The agent gets what's happening, what to do about it, who's involved, what's improving, and the memory context to say it well.

### Idle check-ins

When nothing is urgent, Keyoku notices the silence. After a few quiet ticks, it triggers a personalized check-in — matched to your behavioral patterns and what it knows you're working on. Not "how are you?" but "Hey, how did that API migration go?"

---

## Autonomy Levels

You control how much freedom your agent has when the heartbeat detects something. Set the `autonomy` option to one of three levels:

### `observe` — Watch and log

The agent sees the signals but **does not act on them**. Heartbeat data is logged for debugging or review, but the agent won't message the user or take any action.

**Best for:** Testing, debugging, understanding what Keyoku detects before enabling actions.

### `suggest` — Recommend actions (default)

The agent receives the signals and **suggests actions to the user**. It will surface reminders, ask about deadlines, and flag conflicts — but it frames everything as a suggestion, not an instruction.

**Best for:** Most users. Your agent is helpful and proactive without being pushy. It says things like "Hey, your deadline is Friday — want me to help?" rather than just doing things.

### `act` — Take action immediately

The agent receives the signals and **executes recommended actions directly**. If a reminder is due, it sends it. If a task is overdue, it follows up. No waiting for permission.

**Best for:** Power users who want a fully autonomous assistant that handles things on its own.

```typescript
// Set autonomy in your config
keyokuMemory({
  autonomy: 'suggest',  // 'observe' | 'suggest' | 'act'
})
```

| Level | Agent sees signals | Agent messages user | Agent takes action |
|-------|:-:|:-:|:-:|
| `observe` | Yes | No | No |
| `suggest` | Yes | Yes (as suggestions) | No |
| `act` | Yes | Yes | Yes |

---

## Configuration

Everything works out of the box with defaults. Customize only what you need:

```typescript
keyokuMemory({
  keyokuUrl: 'http://localhost:18900',  // keyoku-engine server URL
  autoRecall: true,                     // inject memories into every prompt
  autoCapture: true,                    // extract facts from conversations
  heartbeat: true,                      // enable proactive heartbeat signals
  incrementalCapture: true,             // capture per-message (real-time)
  topK: 5,                              // max memories injected per prompt
  entityId: 'user-123',                 // memory namespace (default: agent name)
  agentId: 'agent-1',                   // agent identifier
  captureMaxChars: 2000,                // max input chars for capture
  autonomy: 'suggest',                  // 'observe' | 'suggest' | 'act'
})
```

| Option | Default | What it does |
|--------|---------|-------------|
| `autoRecall` | `true` | Before every response, search memory and inject relevant context |
| `autoCapture` | `true` | After every message, extract and store important facts |
| `heartbeat` | `true` | Enable the heartbeat system (proactive signals) |
| `incrementalCapture` | `true` | Capture in real-time per message, not just at session end |
| `topK` | `5` | How many memories to inject per prompt (higher = more context) |
| `entityId` | agent name | Isolate memories per user — each user gets their own memory space |
| `agentId` | agent name | Identify which agent stored a memory (useful for multi-agent setups) |
| `autonomy` | `'suggest'` | How the agent responds to heartbeat signals (see [Autonomy Levels](#autonomy-levels)) |
| `keyokuUrl` | `localhost:18900` | Where keyoku-engine is running |

---

## For Developers: Standalone Memory Client

Building a custom agent without OpenClaw? Use `@keyoku/memory` directly for full programmatic access to the memory engine.

```bash
npm install @keyoku/memory
```

```typescript
import { KeyokuClient } from '@keyoku/memory';

const keyoku = new KeyokuClient();

// Store a memory
await keyoku.remember('user-123', 'Prefers dark mode and TypeScript');

// Semantic search
const results = await keyoku.search('user-123', 'UI preferences');
// => [{ memory: { content: 'Prefers dark mode...' }, similarity: 0.91 }]

// Heartbeat check (zero tokens)
const heartbeat = await keyoku.heartbeatCheck('user-123');
if (heartbeat.should_act) {
  console.log(heartbeat.priority_action);
}

// Full heartbeat with LLM analysis
const ctx = await keyoku.heartbeatContext('user-123', {
  analyze: true,
  autonomy: 'suggest',
  activity_summary: 'User was working on API migration',
});

// Scheduling
await keyoku.createSchedule('user-123', 'my-agent', 'Weekly standup prep', 'weekly');
```

<details>
<summary><strong>Full Client API</strong></summary>

<br>

```typescript
const client = new KeyokuClient({ baseUrl?: string, timeout?: number });
```

| Method | Description |
|--------|-------------|
| `remember(entityId, content, options?)` | Store memories from content |
| `search(entityId, query, options?)` | Semantic search across memories |
| `listMemories(entityId, limit?)` | List all memories for entity |
| `getMemory(id)` | Get a single memory by ID |
| `deleteMemory(id)` | Delete a specific memory |
| `deleteAllMemories(entityId)` | Delete all memories for entity |
| `getStats(entityId)` | Get memory statistics |
| `heartbeatCheck(entityId, options?)` | Zero-token heartbeat check |
| `heartbeatContext(entityId, options?)` | Extended heartbeat with LLM analysis |
| `createSchedule(entityId, agentId, content, cronTag)` | Create a scheduled memory |
| `listSchedules(entityId, agentId?)` | List active schedules |
| `ackSchedule(memoryId)` | Acknowledge a schedule |
| `cancelSchedule(id)` | Cancel a schedule |

</details>

---

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@keyoku/openclaw`](packages/openclaw) | **OpenClaw plugin** — the main package. Auto-recall, auto-capture, heartbeat, tools, CLI | [![npm](https://img.shields.io/npm/v/@keyoku/openclaw?style=flat-square&color=6366f1)](https://www.npmjs.com/package/@keyoku/openclaw) |
| [`@keyoku/memory`](packages/memory) | Standalone HTTP client for developers building custom agents | [![npm](https://img.shields.io/npm/v/@keyoku/memory?style=flat-square&color=6366f1)](https://www.npmjs.com/package/@keyoku/memory) |
| [`@keyoku/types`](packages/types) | Shared TypeScript type definitions | [![npm](https://img.shields.io/npm/v/@keyoku/types?style=flat-square&color=6366f1)](https://www.npmjs.com/package/@keyoku/types) |

## How It Works

```
Your OpenClaw Assistant
    │
    ▼
@keyoku/openclaw (plugin)
    │  Every message:
    │    1. Recall — search memory, inject relevant context
    │    2. Respond — agent replies with full memory awareness
    │    3. Capture — extract facts from the exchange
    │  Every heartbeat tick:
    │    4. Scan — check all 10 signal categories
    │    5. Analyze — LLM evaluates what needs attention
    │    6. Act — agent responds based on autonomy level
    ▼
keyoku-engine (runs locally)
    │  extraction, semantic search, dedup, decay, consolidation
    ▼
SQLite + HNSW Vector Index (your machine, your data)
```

## Development

```bash
npm install   # install dependencies
npm run build # build all packages
npm test      # run tests
npm run clean # clean build artifacts
```

Requires Node.js 20+.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.

<br>
<div align="center">
  <sub>Built by <a href="https://github.com/keyoku-ai">Keyoku</a></sub>
</div>
