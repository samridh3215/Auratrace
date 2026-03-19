---
name: codebase-knowledge
description: >
  Maintain a living Obsidian vault (./knowledgeBase/) that documents a codebase as work happens — reducing repeated file reads and context overflow.

  Trigger after EVERY code edit (str_replace, create_file); when user says "document this", "update the KB", "log this", "note this", "wrap up", "session summary"; when a bug is fixed; when a pattern or gotcha surfaces; when a non-obvious technical choice is made.

  Creates flat-file Obsidian notes (module summaries, issue+resolution logs, bite-sized learnings, decision logs, tips) with timestamps, tags, and Wikilinks. Keeps an INDEX.md home page. The vault is the team's memory — use this skill obsessively to avoid re-reading files.
---

# Codebase Knowledge Vault Skill

Maintains `./knowledgeBase/` as a flat Obsidian vault — one file per topic, tags for structure, Wikilinks for navigation. It is the persistent memory of the codebase so Claude doesn't have to re-read files and developers can learn from the history.

---

## Vault Location

Always at the **project root**: `./knowledgeBase/`

Create the folder on first use if it doesn't exist. Also create `./knowledgeBase/INDEX.md` (the home page) if it doesn't exist.

---

## Note Types

Every note falls into one of these types — reflected in its `type` tag and filename prefix:

| Prefix | Type | When to create/update |
|---|---|---|
| `module-` | Module summary | After first read or edit of any file |
| `issue-` | Issue + resolution | After a bug is fixed or error resolved |
| `learning-` | Bite-sized learning | When a concept, pattern or gotcha surfaces |
| `decision-` | Decision log | When a non-obvious technical choice is made |
| `tip-` | Tip / insight | When Claude notices something worth flagging |
| `session-` | Session summary | At end of session |

---

## File Naming

```
module-<descriptive-slug>.md         e.g. module-auth-middleware.md
issue-<YYYY-MM-DD>-<slug>.md         e.g. issue-2026-03-19-jwt-expiry-crash.md
learning-<slug>.md                   e.g. learning-async-context-propagation.md
decision-<YYYY-MM-DD>-<slug>.md      e.g. decision-2026-03-19-chose-prisma-over-drizzle.md
tip-<slug>.md                        e.g. tip-always-close-db-connections.md
session-<YYYY-MM-DD>.md              e.g. session-2026-03-19.md
```

All slugs: lowercase, hyphen-separated, descriptive.

---

## Frontmatter Template

Every note starts with YAML frontmatter:

```yaml
---
title: <Human readable title>
type: module | issue | learning | decision | tip | session
tags: [<type-tag>, <component>, <language>, <other-relevant-tags>]
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
related: ["[[note-slug]]", "[[other-note]]"]
---
```

- `created` is set once on first write, never changed
- `updated` is refreshed every time the note is modified
- `related` lists Wikilinks to connected notes (see Linking Rules)
- Tags must always include the type tag (e.g. `module`, `issue`, `learning`)

---

## Per-Type Templates

### `module-*.md`

```markdown
---
title: <filename or module name>
type: module
tags: [module, <component>, <language/framework>]
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
related: []
---

# <Module Name>

**File path:** `path/to/file.ext`
**Language/Framework:** ...
**Owned by / part of:** ...

## Purpose
One paragraph: what this file/module does and why it exists.

## Key Exports / Interfaces
- `functionName(args)` — what it does
- `ClassName` — what it represents

## Important Internals
Anything non-obvious about how it works internally.

## Known Gotchas
- Things that surprised us or could trip someone up

## Change Log
| Date & Time | Change Summary |
|---|---|
| YYYY-MM-DD HH:MM | Initial read / created |
```

> **Update rule:** Every time this file is edited, append a row to the Change Log and refresh `updated`.

---

### `issue-*.md`

```markdown
---
title: <Short description of the issue>
type: issue
tags: [issue, <resolved|open>, <component>, <error-type>]
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
related: []
---

# Issue: <Short Title>

**Status:** resolved | open
**Date encountered:** YYYY-MM-DD HH:MM
**Date resolved:** YYYY-MM-DD HH:MM (if resolved)

## What Went Wrong
Clear description of the problem. What was the symptom? What triggered it?

## Root Cause
What was actually broken underneath.

## How It Was Fixed
Step by step. Include code snippets if relevant.

## What To Watch For
Signs this issue might come back, or related footguns.

## Spawned Learnings
- [[learning-slug]] — one-liner on what was learned
```

---

### `learning-*.md`

```markdown
---
title: <Concept or pattern name>
type: learning
tags: [learning, <concept-category>, <language/framework>]
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
related: []
---

# 💡 <Title>

**TL;DR:** One sentence. What's the takeaway?

## The Concept
Explain it simply, as if to a developer who hasn't seen it before.

## Why It Matters Here
How it specifically showed up in this codebase or this session.

## Example
```code
// A short, concrete snippet
```

## Common Mistake
What developers get wrong about this.

## Further Reading *(optional)*
- Link or note if there's more to explore
```

---

### `decision-*.md`

```markdown
---
title: <What was decided>
type: decision
tags: [decision, <component>, <trade-off-area>]
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
related: []
---

# Decision: <Title>

**Date:** YYYY-MM-DD HH:MM
**Made by:** Claude + <user> | <user>

## Context
What was the situation that forced a choice?

## Options Considered
1. **Option A** — pros / cons
2. **Option B** — pros / cons

## Decision
What was chosen and the one-sentence reason.

## Trade-offs Accepted
What we knowingly gave up.

## Affected Modules
- [[module-slug]]
```

---

### `tip-*.md`

```markdown
---
title: <Tip headline>
type: tip
tags: [tip, <area>]
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
related: []
---

# 🔧 <Tip Headline>

**Context:** When does this tip apply?

## The Tip
Clear, direct guidance.

## Why
Short reasoning.

## Example *(optional)*
```code
// before / after, or example usage
```
```

---

### `session-*.md`

```markdown
---
title: Session — YYYY-MM-DD
type: session
tags: [session, YYYY-MM-DD]
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
related: []
---

# Session: YYYY-MM-DD

## What We Worked On
Brief narrative of the session's goal.

## Files Touched
| File | What Changed |
|---|---|
| `path/to/file` | Description |

## Issues Encountered & Resolved
- [[issue-slug]] — one-liner summary

## Decisions Made
- [[decision-slug]] — one-liner summary

## Learnings & Tips Captured
- [[learning-slug]] — one-liner
- [[tip-slug]] — one-liner

## Open Threads
Anything unresolved, TODO, or worth revisiting next session.
```

---

## Linking Rules

Apply these links whenever notes are created or updated:

| If you're writing... | Link to... |
|---|---|
| A `module` note | Any `issue` notes that affected this module |
| An `issue` note | The `module` it occurred in; any `learning` or `tip` it spawned |
| A `learning` note | The `issue` that revealed it (if any); related `module` |
| A `decision` note | The `module(s)` affected by the decision |
| A `tip` note | Any `module` or `issue` it relates to |
| A `session` note | All notes created or updated during that session |
| Any note | `[[INDEX]]` — everything links home |

Add links in **both directions**: if `issue-X` links to `module-Y`, also add `issue-X` to `module-Y`'s `related` field.

---

## INDEX.md — The Home Page

`INDEX.md` is the master entry point for the vault. Keep it updated.

```markdown
---
title: Knowledge Base Index
type: index
tags: [index]
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
---

# 🗂️ Project Knowledge Base

> Auto-maintained by Claude. Last updated: YYYY-MM-DD HH:MM

## Modules
- [[module-slug]] — one-liner description

## Recent Issues
- [[issue-YYYY-MM-DD-slug]] — one-liner (newest first)

## Learnings
- [[learning-slug]] — TL;DR

## Decisions
- [[decision-YYYY-MM-DD-slug]] — one-liner (newest first)

## Tips
- [[tip-slug]] — one-liner

## Sessions
- [[session-YYYY-MM-DD]] (newest first)
```

Always update INDEX.md when a new note is added.

---

## Workflow

### On every code edit (str_replace / create_file)

1. Identify the file being edited.
2. Check if `module-<slug>.md` exists for it.
   - If not → create it using the module template.
   - If yes → append to its Change Log, update `updated`.
3. If the edit was fixing a bug or resolving an error → create an `issue-` note.
4. If a non-obvious choice was made → create a `decision-` note.
5. If a pattern or gotcha surfaced → create a `learning-` or `tip-` note.
6. Update `INDEX.md`.
7. Apply linking rules (update `related` fields bidirectionally).

### On first file read

1. Create the `module-` note (or refresh if stale).
2. This means the file won't need to be re-read later in the session — the note is the reference.

### On "document this" / explicit request

Follow the full workflow above for whatever was just done. Ask the user for any context needed to fill in the template well.

### At end of session

1. Create `session-YYYY-MM-DD.md` summarising the full session.
2. Link to every note created or updated during the session.
3. Update INDEX.md to add the session link.

---

## Style Rules

- **Dates/times** always in `YYYY-MM-DD HH:MM` format (24h).
- **Wikilinks** always use `[[filename-without-extension]]` syntax.
- **Tags** are lowercase, hyphen-separated.
- **Tone**: direct, developer-to-developer. No fluff.
- **Code snippets**: always fenced with the language identifier.
- **No duplication**: if something is already in a note, update that note — don't create a duplicate.
- **Change Log rows** are appended, never edited. Chronological history is sacred.
