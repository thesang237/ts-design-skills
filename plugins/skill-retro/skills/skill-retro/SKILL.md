---
name: skill-retro
description: End-of-project retrospective that turns what happened into better skills. Run it with /skill-retro when a project or a long working session is finished. It gathers evidence (the conversation, saved memory notes, git history), sorts it into what the designer corrected, what broke, what was slow and which new techniques worked, decides where each lesson belongs (a skill, memory, project notes, or nowhere), and proposes specific, minimal edits to the design skills (web-motion, page-transitions, ui-craft, 3d-web, quality-check, create-learn-page and others). It shows everything in a visual report page and saves only the changes the designer approves.
argument-hint: "[optional focus, e.g. 'motion only' or a project path]"
disable-model-invocation: true
---

# Skill retro

A retro turns one project's lessons into every future project's defaults. It never changes a skill
on its own: it **finds, proposes, shows, then saves only what the designer approves.**
Checked on 2026-09-30 against the Claude Code skills and memory docs.

Related skills (the retro edits them; it doesn't repeat them):
- **web-motion**, **page-transitions**, **ui-craft**, **3d-web**, **quality-check**, **create-learn-page**: where most lessons land.
- **quality-check**: if the project needs a fresh measurement, run that skill first and feed its results in here.

## Sang's answers (taste session, 2026-09-30). Use these unless told otherwise

- **Show proposals as a visual report page** (`assets/report-template.html`), one card per proposed
  change with before/after, then approve in chat by ID ("R1, R3, R4").
- **Evidence:** this conversation, saved memory notes, git history. Don't re-run the project unless
  asked (quality-check does that).
- **Scope:** skills **and** memory (personal preferences go to memory, reusable technique goes to a
  skill). Project notes (CLAUDE.md) only when a fact is needed in every session of that project.
- Plain language. The designer is not a developer: explain each lesson in one sentence of design
  terms before showing any code.

## The five steps

1. **Gather evidence** (`references/evidence.md`). Build an evidence list; every item has a source
   you can point to (a message, a memory file, a commit) and one plain sentence. Nothing from memory
   of "how it probably went".
2. **Sort into four kinds**: **Corrected** (the designer changed my output or my taste guess), **Broke**
   (errors, regressions, things that looked done but weren't), **Slow** (retries, long waits, detours,
   work redone), **Worked** (new techniques or checks worth keeping). One item can be in two kinds.
3. **Route each lesson** to exactly one home (`references/routing.md`): a skill (which file, which
   section), memory, project notes, a hook suggestion, or **drop** (one-off, already covered, or too
   specific). Read the target skill first: never add what it already says, and flag conflicts with
   "Sang's answers" as questions, not edits. Also run the **health pass** (`references/health.md`):
   it finds over-long, outdated or broken skills, and its findings join the evidence.
4. **Write proposals and the report** (`references/proposals.md`). Each proposal is the smallest edit
   that captures the lesson: exact file, exact place, before/after text, why, and the evidence IDs.
   Fill `assets/report-template.html` with the data, save it to
   `ts-design-skills/retros/<project>-<yyyy-mm-dd>.html`, and open it for the designer.
5. **Approve, then apply.** Ask which proposal IDs to apply (AskUserQuestion, multi-select, with
   "none" possible). Apply only those, bump each touched plugin's `version` (patch for fixes and
   pitfalls, minor for new sections), update the skill's "Checked on" date if you verified docs,
   add a line to `ts-design-skills/retros/LOG.md`, and report what changed in plain words.

## Core rules

1. **Nothing is saved without approval.** Drafts live in the scratchpad; the report shows them; only
   approved IDs are written. A skipped proposal is not asked again in the same retro.
2. **Every finding cites evidence.** No evidence ID, no proposal.
3. **One lesson, one home.** A preference goes to memory *or* a skill, never both. Skills point to
   each other instead of repeating (web-motion owns timing, 3d-web owns WebGL, and so on).
4. **Second-time rule.** Promote a lesson to a skill when it happened twice, cost real time (over
   ~15 minutes or a redo), or broke something a visitor would see. Otherwise note it as "watch" in
   the report and drop it.
5. **Generalise.** No client names, brand assets, real copy, or code copied as-is. Rewrite examples
   with placeholder names and the smallest code that shows the idea.
6. **Taste is asked, never inferred.** If a lesson changes a design decision (a curve, a duration,
   a style), the proposal becomes a question for the designer, with a recommended option.
7. **Small edits.** Change the sentence, row or checklist item that matters; don't rewrite sections
   that weren't involved. Keep every SKILL.md under 500 lines; push detail into `references/`.
8. **Record what happened, not what should have.** Broken things are written as "what showed up →
   fix", like the existing pitfalls files.
9. **No new automation without asking.** Hooks (things that must always run) are proposed with a
   plain explanation; they are never created by the retro.

## Quality checklist (before showing the report)

- [ ] Every finding has an evidence ID and a one-sentence plain explanation
- [ ] All four kinds are covered (write "nothing found" rather than leaving one out)
- [ ] Each proposal names the exact file and place, and shows before/after
- [ ] No proposal duplicates something the target skill already says (searched it first)
- [ ] Taste changes are phrased as questions, with the current answer shown
- [ ] No client names, brand assets or copied code in any proposed text
- [ ] SKILL.md files stay under 500 lines after the edits
- [ ] The report opens and reads well on a laptop screen
- [ ] After applying: versions bumped, LOG.md updated, and a plain summary of what changed

## Reference files

- `references/evidence.md`: where evidence lives (conversation, memory folder, git) and how to read it
- `references/routing.md`: where each kind of lesson belongs, with examples
- `references/proposals.md`: proposal format, the report data shape, versioning and the log
- `references/health.md`: the skill health pass (length, broken links, stale dates, marketplace)
- `references/pitfalls.md`: what goes wrong in retros
- `scripts/health.mjs`: runs the health pass (read-only)
- `assets/report-template.html`: the visual report; fill its JSON block, don't edit its markup
