# Keeping skill docs in sync with `docs/`

## The problem

Skills (`skills/*/Skill.md` and any bundled reference files) are packaged and
shipped to users independently of this repo. We can't assume a skill has
access to a local checkout of `docs/` at runtime, so a skill that needs
reference material (job schemas, config options, API details, etc.) has to
either fetch it from somewhere or bundle it. Either way, we need a strategy
that keeps that content from silently drifting away from the source of truth
in `docs/`.

Note: `docs/` is already published to
https://terascope.github.io/teraslice/docs/ via `ts-scripts docs`, so a
hosted, always-current copy of everything in `docs/` exists.

## Options

### 1. Link to the published docs site (fetch at runtime)

Skill instructions reference `https://terascope.github.io/teraslice/docs/...`
URLs directly. When the skill runs, Claude fetches the live page instead of
relying on bundled content.

- **Pros:** No duplication, zero sync effort — the published site is already
  generated from `docs/` on every doc change. Skill package stays small.
- **Cons:** Requires network access at runtime. Adds latency/fetch step to
  every skill invocation. If the docs site restructures a page or moves
  content, the skill's hardcoded URLs/anchors can break silently.

### 2. Bundle distilled reference files, regenerated from `docs/` at package time

Add a build step (extend `ts-scripts docs` or a new script) that
extracts/condenses relevant `docs/` content into each skill's `references/`
folder as part of packaging, so the bundled copy is always regenerated from
source rather than hand-edited.

- **Pros:** Works fully offline. Skill content can be tailored/condensed for
  the specific task instead of pointing at a whole doc page. Sync is
  enforced mechanically, not by memory.
- **Cons:** Real upfront work to build and maintain the generation tooling.
  Someone has to remember to run the build before shipping a skill (or wire
  it into CI/release). Adds a new build dependency between `docs/` and
  `skills/`.

### 3. Bundle hand-maintained reference files

Write skill-specific `references/*.md` files by hand, independent of
`docs/`, and periodically re-check them against the source docs (manually or
via a CI diff/staleness check).

- **Pros:** Simplest to start — no tooling needed, content can be written
  exactly the way the skill needs it.
- **Cons:** Most prone to silent drift. Relies on humans remembering to
  update skill copies whenever the underlying docs change. A CI check could
  catch *some* drift (e.g. "has docs/X.md changed since this reference file
  was last touched?") but won't catch semantic drift.

## Open questions for discussion

- Do skills need docs content offline (air-gapped/no-network use), or is
  network access to `terascope.github.io` a safe assumption?
- If we go with option 2, does the generation step belong in `ts-scripts
  docs`, or as its own script scoped to `skills/`?
- Could we mix approaches — link to the docs site for large/rarely-needed
  reference material, and bundle small distilled snippets for the few facts
  a skill needs on every invocation?
