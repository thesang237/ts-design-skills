# Skill health pass

Run this during step 3, before writing proposals. It finds problems in the skills themselves, so
the retro can fix them in the same report. Run from the `ts-design-skills` folder:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/health.mjs" .
```

It reports, per skill:

| Check | Why it matters | Typical proposal |
| --- | --- | --- |
| SKILL.md over 500 lines | Loads into every turn once used; long files are followed less reliably | Move detail into `references/` |
| A `references/…` link that points to a missing file | Claude is told to read a file that isn't there | Fix the path or remove the line |
| "Checked on <date>" older than 6 months, or missing | Tool versions and APIs drift | Re-check the docs, update the line |
| Plugin in `plugins/` missing from `marketplace.json` (or the reverse) | The skill can't be installed | Add or remove the entry |
| `description` missing a "use when…" trigger, or over 1,536 characters with `when_to_use` | Claude won't pick the skill, or the listing gets truncated | Rewrite the first sentence |
| Placeholder text (`TODO`) left in a SKILL.md | An empty skill loads and says nothing | Draft it, or mark it clearly as not ready |

Treat its output as evidence (kind: Broke or Slow) with IDs like any other.
