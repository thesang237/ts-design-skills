# My Design Skills

A personal collection of design skills for [Claude Code](https://claude.com/claude-code). Once it's published, you (or anyone you share it with) can install the skills with a couple of commands.

## What's inside

| Skill | What it's for |
| --- | --- |
| **ui-craft** | Interface design craft: layout, spacing, typography, color, polish |
| **web-motion** | Motion presets (easing, durations, stagger) shared by CSS, GSAP and Motion; scroll reveals and scroll scenes; hover and press; text reveals; reduced motion and performance. Has a runnable demo in `demos/web-motion` |
| **page-transitions** | First-load intro/loader and page transitions for React / Next.js (native View Transitions, GSAP, Motion). Has a runnable demo in `demos/page-transitions` |
| **3d-web** | 3D on the web: scenes, lighting, materials, performance |
| **quality-check** | Reviewing work for consistency, accessibility and polish |

## How it's organized (plain-language version)

Three words matter here:

- **Skill**: a text file of instructions that teaches Claude how to do something your way. It's a file called `SKILL.md`.
- **Plugin**: a small package that holds a skill. Here, each skill has its own plugin, so people can install only the ones they want.
- **Marketplace**: this whole folder. It's a catalog that lists the plugins and says where to find them.

```
ts-design-skills/
├── README.md                      ← this file
├── .claude-plugin/
│   └── marketplace.json           ← the catalog: lists the 4 plugins
└── plugins/
    ├── ui-craft/
    │   ├── .claude-plugin/plugin.json   ← the plugin's name and description
    │   └── skills/ui-craft/SKILL.md     ← YOUR INSTRUCTIONS GO HERE
    ├── web-motion/     (same layout)
    ├── 3d-web/         (same layout)
    └── quality-check/  (same layout)
```

**The only files you'll normally edit are the four `SKILL.md` files.** Right now they're placeholders with a `TODO` in them.

## What you need to do

### 1. Write your skills

Open each `SKILL.md` (for example `plugins/ui-craft/skills/ui-craft/SKILL.md`) in any text editor. It has two parts:

```
---
name: ui-craft
description: One or two sentences saying WHEN Claude should use this skill.
---

# UI Craft

Your instructions, written in plain language.
```

- The **`description`** at the top is important. Claude reads it to decide when to use the skill, so be specific (for example "Use when designing or reviewing a web interface layout, spacing, typography or color").
- Everything below the second `---` line is your instructions. Write it as if you're briefing a designer colleague: what good looks like, what to avoid, what steps to follow.
- You can put extra files (reference notes, checklists) in the same folder as `SKILL.md` and mention them in your instructions.

### 2. Put this folder on GitHub

Claude Code installs marketplaces from GitHub (or any git host).

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Click **New repository**. Name it `ts-design-skills`. Choose **Private** if you want only yourself (and people you invite) to use it, or **Public** for anyone.
3. Upload this folder's contents. The easiest way without the command line is [GitHub Desktop](https://desktop.github.com): choose *File → Add local repository*, pick this folder, follow the prompt to create the repository, then click **Publish repository**.

Make sure the hidden `.claude-plugin` folder is included. On a Mac, press `Cmd + Shift + .` in Finder to show hidden files.

### 3. Install it in Claude Code

In Claude Code, run these two commands. Replace `thesang237` with your GitHub username:

```
/plugin marketplace add thesang237/ts-design-skills
```

Then install whichever skills you want:

```
/plugin install ui-craft@ts-design-skills
/plugin install web-motion@ts-design-skills
/plugin install 3d-web@ts-design-skills
/plugin install quality-check@ts-design-skills
```

(For a private repository, you need to be signed in to GitHub on your computer.)

### 4. Testing before you publish

You can try it straight from this folder without GitHub. In Claude Code:

```
/plugin marketplace add /Users/sang/Documents/dev/ts-design-skills
```

Then use the same `/plugin install ...` commands as above.

### 5. After you change a skill

Save your edits, publish them to GitHub again (in GitHub Desktop: *Commit*, then *Push origin*). Then in Claude Code run `/plugin marketplace update ts-design-skills`. If people don't seem to get your changes, bump the `"version"` number in that plugin's `plugin.json` file (for example `0.1.0` to `0.2.0`).

## Adding a new skill later

1. Copy one of the folders in `plugins/` and rename it (for example `plugins/my-new-skill`). Also rename the inner `skills/<name>` folder to match.
2. Edit `plugin.json` inside it (name, description) and write the `SKILL.md`.
3. Add a new entry to `.claude-plugin/marketplace.json`, copying an existing one.
