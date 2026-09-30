# Skill retro demo

What you see at the end of a project when you run `/skill-retro`: one report page with what
happened, the proposed changes to your skills, and the evidence behind each one. The content here
is a sample retro of a real project, with names removed.

## Open it

Double-click `index.html` (no install, no server). It works offline and follows your system's light
or dark mode.

## What to try

- Read **What happened**: four columns, Corrected, Broke, Slow, Worked. Each line ends with its
  evidence ID (E4, E6…).
- Scroll to **Proposed changes**. Each card shows which skill file it would change, where, and the
  exact new text (green). Taste changes (like R7) show options instead, with the recommended one outlined.
- Hover an evidence chip (E6) to read the evidence.
- Filter by skill with the round buttons.
- Tick a few cards: a bar appears at the bottom with the text to paste back into chat
  (for example "Apply R1, R4"). Only those changes would be saved.
- Check **Watch**: things noticed once, kept out of the skills until they happen again.

## How it's made

`index.html` is the skill's own template (`plugins/skill-retro/skills/skill-retro/assets/report-template.html`)
with `sample-data.json` pasted into its data block. The retro only ever writes that data block, so
every report looks the same.
