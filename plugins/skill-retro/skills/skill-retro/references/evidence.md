# Gathering evidence

The retro is only as good as its evidence. Collect first, judge later. Give every item an ID
(`E1`, `E2`…), a source, and one plain sentence.

## 1. This conversation (richest source)

Read the whole session, top to bottom. Look for:

| Signal | What it usually means | Kind |
| --- | --- | --- |
| The designer rejects, rewrites or re-asks ("no, smaller", "that's not what I meant") | A taste guess was wrong | Corrected |
| An answer to a taste question that differs from the skill's default | The skill's default may be wrong or incomplete | Corrected |
| A console error, failing build, lint/type error, visual bug found in a screenshot | Something broke | Broke |
| "Done" said before a check actually ran (e.g. a command that silently didn't execute) | False confidence | Broke |
| The same fix attempted twice, a tool retried, long waits, a detour to debug the environment | Time sink | Slow |
| A check or technique that caught a problem quickly, a pattern reused several times | Worth keeping | Worked |

Quote the smallest useful fragment (under 20 words) or summarise it. Note the rough position
("early", "while building chapter 3") so the designer can recognise it.

If the conversation was compacted, the summary at the top is evidence too; say that detail may be
missing.

## 2. Saved memory notes

Claude's auto memory for the project lives in `~/.claude/projects/<project>/memory/`
(`<project>` = the working directory path with non-letters replaced by `-`). `MEMORY.md` is the
index; each other file is one note with a `type`:

- `feedback`: corrections and confirmed approaches. Strong evidence for **Corrected** and **Worked**.
- `user`: who the designer is and how they like to work. Context, rarely a skill change.
- `project` / `reference`: facts and pointers. Check whether a skill should point to them.

Also note memory that is **stale or contradicts** a skill: that's a finding in itself.

## 3. Git history (when the project is a git repository)

Run read-only commands; never commit, reset or checkout during a retro.

```bash
git log --since="<project start>" --pretty='%h %ad %s' --date=short   # the story
git log --since="<start>" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -15  # churn: files changed most
git log --since="<start>" -i --grep='fix\|revert\|hotfix\|broken' --oneline                     # fixes and reverts
git show --stat <sha>                                                   # what a fix touched
```

- A file edited many times often means a fragile area or unclear rules.
- A "fix" right after a "feat" is a Broke item: what was missed?
- Uncommitted work: `git status --short` and `git diff --stat`. Don't judge unfinished work as broken.

## 4. Optional: a fresh measurement

Only when the designer asks. Run the **quality-check** skill and use its report as evidence (with
numbers), instead of measuring inside the retro.

## What not to use

- Transcript files on disk (`~/.claude/projects/<project>/*.jsonl`): the format is internal and
  changes between versions. If an older session matters, ask the designer to resume it, or use
  `claude -p --resume <session-id> "list the corrections I made"` to ask it directly.
- Guesses about what "probably" went wrong. No source, no evidence.

## Evidence list format (kept in the scratchpad, shown in the report)

```text
E4 · Broke · conversation (building the demos)
     A type-check command was wrapped in a tool that doesn't exist on this machine, so it printed
     "done" without running. Found later when the real check showed 5 errors.
E9 · Corrected · memory/feedback-plain-language.md
     The designer wants plain language and to be asked before any design decision.
```
