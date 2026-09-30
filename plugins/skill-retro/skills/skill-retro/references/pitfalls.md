# Pitfalls: what goes wrong in retros

| Problem | How it shows up | Fix |
| --- | --- | --- |
| Lessons from memory of "how it went" | Findings the designer doesn't recognise; confident but wrong | Evidence first, with IDs; drop anything without a source |
| Only bugs get recorded | The retro misses taste corrections, the most valuable lessons | Always fill all four kinds: Corrected, Broke, Slow, Worked |
| Every small thing becomes a rule | Skills bloat, rules contradict, SKILL.md passes 500 lines | Second-time rule; "watch" list for one-offs |
| The same lesson added to two skills | They drift apart later | One home; the other skill points to it |
| Taste overwritten by a single project | The next project inherits one client's style | Taste changes are questions with the current answer shown |
| Project specifics leak into skills | Client names, real copy, exact file paths in a reusable skill | Generalise examples; placeholders only |
| Code copied from the project | Skills carry someone's implementation (and bugs) | Rewrite minimal, clean examples |
| Big rewrites of whole sections | Hard to review; good existing text lost | Smallest edit at an exact place, shown as before/after |
| Changes saved before approval | Designer loses control of their skills | Draft in scratchpad → report → approve by ID → apply |
| "Done" claimed after a check that never ran | E.g. a command wrapper missing on this OS, output filtered to nothing | When a check prints nothing, confirm it ran (exit code, a known-bad input) |
| Environment problems mistaken for skill lessons | A port taken by another session, a hidden browser pane | Record them as "watch" unless they will recur on every project |
| Retro never happens | Lessons lost | Run it at the end of each project; the report archive in `retros/` shows the history |
