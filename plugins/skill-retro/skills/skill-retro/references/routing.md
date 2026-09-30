# Where does a lesson belong?

Pick exactly one home per lesson. When in doubt, ask: *"Who needs to know this, and when?"*

| The lesson is… | Home | Example |
| --- | --- | --- |
| A reusable way of doing a type of work (technique, rule, checklist item, pitfall) | **A skill** (the one that owns the topic) | "Hidden tooltips near the edge can widen the page on phones; clip horizontal overflow on the page root." → quality-check checklist + ui-craft pitfall |
| A designer preference that applies across projects | **A skill's "Sang's answers"** (if it's about that skill's topic) or **memory** (`user`/`feedback`) | "Reveals rise 18px, never more" → web-motion answers |
| How the designer likes to work with Claude (tone, when to ask, how to present) | **Memory** (`feedback`) | "Show a summary before saving skill files" |
| A fact about this one project, needed every session there | **Project notes** (`CLAUDE.md`) | "This site scales the root font-size; use px or scope 16px on guide pages" |
| Something that must happen every time, no exceptions | **Hook suggestion** (explain it; never create it) | "Run the type-check before every commit" |
| One-off, already covered, or too specific to reuse | **Drop** (list it under "watch" in the report) | A typo in one component |

## Which skill owns what

| Topic | Skill |
| --- | --- |
| Easing, durations, stagger, scroll reveals/scenes, text effects, hover/press, smooth scroll, reduced motion for UI | web-motion |
| Loaders, intros, route changes, shared-element morphs | page-transitions |
| Layout, spacing, typography, colour, component polish | ui-craft |
| WebGL/WebGPU, three.js, shaders, 3D assets, 3D performance and fallbacks | 3d-web |
| Measuring, reviewing, cross-browser/phone checks, accessibility audits | quality-check |
| Breakdown / "learn" pages that teach a project | create-learn-page |
| The retro itself (this skill) | skill-retro |

If no skill fits and the lesson came up twice, propose a **new skill** (name, one-line purpose,
first three rules) instead of stuffing it into the nearest one.

## Where inside a skill

| Kind of lesson | Section |
| --- | --- |
| New default or changed taste | "Sang's answers" (as a question first) |
| Must-do rule | "Core rules" (one numbered line) |
| Something to verify before calling work done | "Quality checklist" |
| What broke and its fix | `references/pitfalls.md` (table row: problem · how it showed up · fix) |
| A technique with code | the matching `references/*.md`, or a new reference file linked from SKILL.md |
| A newer/better tool version or API | the reference file + update "Checked on" date |

## Conflicts

- A lesson contradicts "Sang's answers" → it becomes a **question** in the report, with the
  current answer, the evidence, and a recommended option. Never overwrite taste silently.
- Two skills say different things → propose one change that makes them agree, and point one to the
  other.
- Memory contradicts a skill → propose updating whichever is stale; say which and why.
