# Proposals, the report, and applying changes

## A good proposal

- **One lesson, one small edit.** A row, a rule, a checklist line, or a short reference section.
- **Exact place**: file path inside `ts-design-skills`, and the section heading it goes under.
- **Before / after**: the current text (or "new") and the proposed text, both short.
- **Why, in design terms**: one sentence a designer would agree with ("Phones got a sideways
  scroll because hidden tooltips were wider than the screen").
- **Evidence IDs** it rests on.
- **Kind**: `rule`, `checklist`, `pitfall`, `technique`, `answer` (taste question), `memory`,
  `project-note`, `hook`, `new-skill`.
- **Size**: `S` (a line), `M` (a paragraph or table), `L` (a new reference file or skill).

Taste proposals (`answer`) always carry `options` with one marked recommended; the designer picks.

## Report data (fill the JSON block in `assets/report-template.html`)

Copy the template to `ts-design-skills/retros/<project>-<yyyy-mm-dd>.html` and replace only the
contents of `<script type="application/json" id="retro-data">`. Keep strings plain text (the page
escapes them). Shape:

```json
{
  "project": "Scroll-driven WebGL guide",
  "date": "2026-09-30",
  "summary": "Two sentences: what was built and the headline lesson.",
  "stats": [{ "label": "Corrections", "value": 3 }, { "label": "Breaks", "value": 7 }],
  "evidence": [
    { "id": "E4", "kind": "broke", "source": "conversation · building demos", "text": "…" }
  ],
  "findings": {
    "corrected": ["Plain sentence (E9)"],
    "broke": ["…"],
    "slow": ["…"],
    "worked": ["…"]
  },
  "proposals": [
    {
      "id": "R1",
      "kind": "pitfall",
      "size": "S",
      "target": "plugins/quality-check/skills/quality-check/references/pitfalls.md",
      "section": "Layout",
      "title": "Hidden tooltips widen phones",
      "why": "One sentence in design terms.",
      "before": "(new row)",
      "after": "| Hidden tooltip near the edge | Page scrolls sideways at 375px | overflow-x: clip on the page root |",
      "evidence": ["E12"],
      "options": null
    }
  ],
  "watch": ["One-off things noted but not promoted (second-time rule)."]
}
```

Open the saved file for the designer (`open <path>` on macOS), then ask for approval with
AskUserQuestion (multi-select of proposal IDs, grouped by skill if there are many). Mention that
unselected proposals are simply not applied.

## Applying approved proposals

1. Edit only the approved targets, at the stated place, with the stated text (adjusted only for
   formatting). If the file changed since the proposal was drafted, re-read it and show the new diff.
2. Bump `version` in each touched `plugins/<skill>/.claude-plugin/plugin.json`:
   patch (`0.2.0 → 0.2.1`) for pitfalls, checklist lines and wording; minor (`0.2.0 → 0.3.0`) for new
   rules, sections, reference files or taste changes.
3. If documentation was re-checked, update the skill's "Checked on <date> against …" line.
4. Memory proposals: write or update one memory file each and its line in `MEMORY.md`.
5. Append one line per retro to `ts-design-skills/retros/LOG.md`:
   `2026-09-30 · <project> · applied R1 R3 R4 · skipped R2 · skills: web-motion 0.3.1, quality-check 0.1.1`
6. Tell the designer what changed, per skill, in plain words, and remind them to publish
   (`/plugin marketplace update ts-design-skills` after pushing) if they use the skills elsewhere.

## New skill proposals

Only when a topic has no owner and came up twice. Propose: folder name, the `description` line
(when to use it), three core rules, and the first reference file. Build it with the same shape as
the existing skills (SKILL.md + `references/` + plugin.json + marketplace entry) after approval.
