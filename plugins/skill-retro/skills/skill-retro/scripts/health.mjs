// Skill health pass: node health.mjs <path-to-ts-design-skills>
// Read-only. Prints one block per skill with the problems found.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const pluginsDir = path.join(root, 'plugins');
const market = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'));
const listed = new Set(market.plugins.map((p) => p.name));
const today = new Date();
let problems = 0;

for (const plugin of fs.readdirSync(pluginsDir).filter((d) => !d.startsWith('.') && fs.statSync(path.join(pluginsDir, d)).isDirectory())) {
    const out = [];
    if (!listed.has(plugin)) out.push('not listed in marketplace.json');
    const skillsDir = path.join(pluginsDir, plugin, 'skills');
    for (const skill of fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir).filter((d) => !d.startsWith('.')) : []) {
        const file = path.join(skillsDir, skill, 'SKILL.md');
        if (!fs.existsSync(file)) {
            out.push(`${skill}: no SKILL.md`);
            continue;
        }
        const text = fs.readFileSync(file, 'utf8');
        const lines = text.split('\n').length;
        if (lines > 500) out.push(`${skill}: SKILL.md is ${lines} lines (keep under 500)`);
        if (/\bTODO\b/.test(text)) out.push(`${skill}: contains TODO placeholder text`);
        const desc = text.match(/^description:\s*(.+)$/m)?.[1] ?? '';
        if (!desc) out.push(`${skill}: missing description`);
        else if (!/\buse (it )?(when|for)|\brun it\b/i.test(desc)) out.push(`${skill}: description has no clear "use when…" trigger`);
        if (desc.length > 1536) out.push(`${skill}: description is ${desc.length} characters (listing truncates at 1,536)`);
        const checked = text.match(/Checked on (\d{4}-\d{2}-\d{2})/)?.[1];
        if (!checked) out.push(`${skill}: no "Checked on <date>" line`);
        else if ((today - new Date(checked)) / 864e5 > 183) out.push(`${skill}: docs last checked ${checked} (over 6 months)`);
        for (const [, ref] of text.matchAll(/`((?:references|assets|scripts)\/[^`\s]+)`/g)) {
            if (!fs.existsSync(path.join(skillsDir, skill, ref))) out.push(`${skill}: links to missing ${ref}`);
        }
    }
    for (const p of market.plugins) if (!fs.existsSync(path.join(root, p.source))) out.push(`marketplace lists ${p.name} but ${p.source} is missing`);
    problems += out.length;
    console.log(`\n${plugin}${out.length ? '' : '  ✓'}`);
    out.forEach((o) => console.log(`  - ${o}`));
}
console.log(`\n${problems} problem(s) found.`);
