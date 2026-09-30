# Teaching patterns

## The section pattern

Every section follows this order. Skip a step only when it truly doesn't apply.

1. **The idea in plain words** (2 to 4 sentences): what you see, then how it works, no jargon without a `Term`.
2. **Designer lens**: the same idea in tools the reader already knows ("this is an After Effects
   comp; the scroll bar is the playhead").
3. **Demo** with a hint line ("Drag X. Watch Y.").
4. **Code** from the source, trimmed, with the file path as caption and 1 to 3 highlighted lines.
5. **Try this**: 2 to 4 prompts, at least one that breaks or exaggerates the effect.
6. **Remember**: one sentence, quotable.
7. **In the source →** file chips (usually at the end of the chapter's last section).

## Chapter shape

`ChapterHead` (promise as title) → 4 to 7 sections → flashcards → previous / next.
Titles are promises or plain statements ("Everything is a number from 0 to 1."), not topic labels
("Progress mapping").

## Voice

- Talk to a designer colleague. Short sentences. "You" and "we".
- Lead with the visible result, then the mechanism, then the numbers.
- Name the values the source uses and what they feel like ("0.085: heavy, cinematic").
- Say what's fragile or what the source could do better, gently, in a Callout.
- Vocabulary bridge in chapter 0: design word ↔ code word ↔ meaning. Reuse those words everywhere.
- Glossary entries: `plain` (one sentence) + `lens` (optional design analogy).

## Block catalogue

| Need | Block |
| --- | --- |
| Compare two approaches | `Grid` of two `Card`s (one tinted "most sites", one "this project") |
| A recipe | `Steps` |
| Values and their feel | `Table`: setting · value · what it feels like |
| A warning | `Callout tone="warn"` |
| "This guide does it too" | `Callout tone="meta"` |
| The one thing to memorise | `KeyIdea` |
| Deep but optional | a collapsible `<details>` step (used in the build chapter) |

## Flashcards and quiz

- 3 to 5 cards per chapter. Questions ask for **recall and reasoning** ("Why is the timeline's default
  ease 'none'?"), not trivia. Answers are 1 to 2 sentences with the number or rule.
- The final quiz draws 10 random cards from all chapters, reveals on demand, self-graded ("I had it" /
  "Not quite"), and lists missed questions with their chapter at the end.
- The build chapter includes a **planning tool** (for example storyboard → timeline code) so the reader
  leaves with a starting point for their own project.
