---
name: split-commit
description: Split PR changes into many categorized file-level commits before opening or updating a pull request for teammates. Use whenever committing, preparing a PR, or when history is one squash/WIP blob.
---

# Split commit (mandatory)

Read and follow `agents/rules/git-commits.mdc`.

## Bar

- Default: **one commit per file** (tiny pairs only when an `index.ts` re-export must ship with a new helper).
- A multi-thousand-line PR with ~10–20 commits is **too coarse** — resplit.
- Smell: `changed_lines / commit_count` ≫ ~150–200 on a multi-file PR.

## When to use

- Before every `git push` that updates a teammate-facing PR
- After a soft-reset / rebase when the working tree holds an entire feature
- When `git log` shows fat folder-level commits

## How

1. Pathspec stage one file (or one tiny pair): `git add path`
2. Subject must start with `(feature)` `(bug)` `(cleanup)` `(docs)` `(refactor)` `(test)` `(chore)` or `(internal)`
3. Order: docs → migrations → schemas/db → libs → API/UI → agent → tests
4. Bad history: `git reset --soft <base>` then `git reset` (unstage), then recommit — **never** `reset --hard` while feature files exist only in the working tree

## Anti-patterns

- One commit for all of `libs/account/` or all of `tests/`
- Squash-merging a carefully split branch into main
- `git add -A && git commit` for mixed concerns
