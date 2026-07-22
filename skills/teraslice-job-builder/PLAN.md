# Plan: `teraslice-job-builder` skill

## Purpose

Help a user author, review, lint, and validate a Teraslice **job.json** — the
config that defines a job's `lifecycle`, `workers`, `assets`, and its
pipeline of `operations` (one reader, zero-or-more processors, one sender)
plus any reusable `apis`.

**In scope:** interviewing the user about their pipeline, selecting
appropriate operations/assets, assembling a correct job.json, linting it
continuously, and deep-validating it against the real Teraslice schema when
available.

**Out of scope (for v1):** driving `teraslice-cli`/`tjm` to actually
register or start a job against a cluster. The skill hands the user a
validated job.json and tells them the next command to run themselves —
it doesn't need cluster credentials/aliases to do its job.

## Decisions made with the user

- **Runtime scope: standalone/portable.** Don't assume the skill runs from
  inside a teraslice checkout with `docs/`, `examples/`, and
  `packages/job-components` on disk. It must work as a packaged `.skill`
  for someone with no local clone.
- **Validation: two tiers.** A fast, dependency-free structural **lint**
  run after every edit, plus an occasional **deep validate** (real schema
  validation) run when the user says they're ready to test/register.
- **Core scope: author + validate**, not author + validate + deploy.

## What this means for `references/` (resolving `DOCS_SYNC.md`)

`skills/DOCS_SYNC.md` left open how a skill should source `docs/` content
without drifting. **Decision (updated with user):** go with
**Option 1 (link-driven from the live published docs)** as the primary
strategy, not Option 3. The published site
(`https://terascope.github.io/teraslice/docs/...`) is regenerated from
`docs/` on every change, so linking to it keeps the skill's reference
content current with zero sync effort and no risk of vendored copies
silently drifting.

How the `references/` files work under this decision:
- Each `references/*.md` is **thin and pointer-first**: it names the
  canonical live URL(s) at the top and instructs Claude to `WebFetch` them
  for authoritative / current detail. The reference file itself is a
  router + a small cheat-sheet, not a full copy of the docs.
- Files carry only **stable structural facts** (field names, the `≥2
  operations` rule, ordering conventions, the `@asset:version` collision
  syntax) and **skill-specific guidance not in the docs** (lint rules,
  handoff command). These change rarely and give the skill useful answers
  without a round-trip for trivial questions.
- URL structure is verified: `docs/<path>.md` publishes to
  `https://terascope.github.io/teraslice/docs/<path>` (docusaurus
  `path: '../docs'`, default `/docs/` route). External asset bundles have
  their own sites (see `common-assets.md`).
- Network is assumed available at runtime. If offline, the cheat-sheets
  still cover the common cases; Claude notes when a fetch was needed but
  unavailable rather than guessing.

This concretely resolves `DOCS_SYNC.md` for this skill in favor of Option 1;
flag it there as the first real consumer once v1 ships.

## `Skill.md` outline

1. **What a Teraslice job is** (1–2 sentences) + what this skill does.
2. **Workflow**
   - Gather requirements: lifecycle (`once` vs `persistent`), data source,
     transforms needed, destination, rough volume/worker count, which asset
     bundles the user's cluster actually has installed.
   - Pick operations: reader first, processors in the middle, sender last;
     consult `references/operations.md` + `references/common-assets.md` +
     `references/builtin-operations.md`; use `@assetName`/`@assetName:version`
     suffixes when an op name collides across assets.
   - Assemble the job.json: start from the closest `assets/templates/*.json`
     skeleton (batch-once vs persistent-streaming) rather than from scratch;
     fill fields per `references/job-schema.md`.
   - Lint early and often: run `scripts/lint-job.mjs` after every edit.
   - Deep-validate before handoff: when the user is ready to test/register,
     run `scripts/deep-validate-job.mjs`.
   - Handoff: tell the user the `teraslice-cli tjm register <cluster>
     job.json [--start]` command to run next — don't run it for them.
3. **Reference index** — one-line table: file → when to open it.
4. **Limitations** — asset-bundle details (`common-assets.md`) describe
   external repos not vendored here and may lag; treat version-specific
   fields as "verify against the asset's own docs" rather than gospel.

## `references/` file plan

| File | Content | Primary source |
|---|---|---|
| `job-schema.md` | Top-level job fields table (name, lifecycle, workers, slicers, assets, operations, apis, max_retries, probation_window, env_vars, etc.), k8s-only fields called out separately | `job-schemas.ts`, `docs/jobs/configuration.md` |
| `operations.md` | Generic per-op fields (`_op`, `_encoding`, `_dead_letter_action`), reader/processor/sender ordering convention, reader = slicer+fetcher, processor variants (batch/each/map/filter), asset/op name collision syntax | `docs/jobs/types-of-operations.md`, `docs/jobs/configuration.md` |
| `apis.md` | Top-level `apis` array shape, `api_name` cross-referencing, worked example | `docs/jobs/configuration.md` |
| `builtin-operations.md` | `script`, `stdout`, `noop`, `delay`, `test-reader` — the ops that ship with core and need no asset | `docs/jobs/builtin-operations.md` |
| `common-assets.md` | Cheat sheet for the most-used external asset bundles (elasticsearch-assets, kafka-assets, standard-assets, file-assets) and their common ops (`elasticsearch_reader`, `elasticsearch_bulk`, `kafka_reader`, `kafka_sender`, `data_generator`) — flagged as external/higher staleness-risk | `docs/asset-bundles.md` + published bundle repos (fetch to confirm specifics) |

## `assets/templates/` plan

Bundled, fill-in-the-blanks job.json starting points (adapted from
`examples/jobs/*.json`, genericized since a portable skill won't have the
repo's `examples/` on disk):
- `batch-once.json` — simple reader → processor → sender, `lifecycle: once`
- `persistent-streaming.json` — `lifecycle: persistent` with
  `probation_window`
- `custom-asset.json` — job referencing a custom `_op` from a user-authored
  asset, as a starting point when no existing asset bundle fits

## `scripts/` plan

- **`lint-job.mjs`** — zero-dependency Node script, safe to run anywhere.
  Checks structural mistakes without needing Teraslice installed: missing
  `_op` on an operation, `operations.length < 2`, `api_name` referencing an
  api not declared in `apis`, invalid `lifecycle` value, unknown top-level
  fields, k8s-only fields present without a k8s cluster manager, etc. This
  is the "run after every edit" tool.
- **`deep-validate-job.mjs`** — attempts
  `require.resolve('@terascope/job-components')`. If resolvable (e.g. the
  user is working inside a teraslice checkout, or has it installed as a dev
  dependency), runs the real `JobValidator` for full convict-schema
  validation. Note the honest limitation: per-operation schema validation
  needs that operation's own asset resolvable too, so deep validation is
  strongest on top-level job fields and weaker on op-specific fields from
  asset bundles the user doesn't have installed locally. If unresolvable,
  reports clearly what was skipped and suggests the real check: register
  against an actual cluster with `teraslice-cli`.

## Open questions / follow-ups (not blocking v1)

- Should `common-assets.md` eventually be generated by fetching the
  published bundle repos' docs rather than hand-maintained? Worth revisiting
  once the `DOCS_SYNC.md` tooling question is settled.
- If the user later wants registration/deployment support, that's a
  distinct scope increase (needs cluster alias handling) — treat as a
  separate skill or a v2 scope change, not folded in silently.

## Next steps

1. Write `Skill.md` per the outline above.
2. Draft the three `references/*.md` files + `common-assets.md`.
3. Write `assets/templates/*.json`.
4. Write `scripts/lint-job.mjs` and `scripts/deep-validate-job.mjs`.
5. Per skill-creator's process: draft 2–3 realistic test prompts (e.g. "build
   a batch job reading from Elasticsearch and writing to S3", "here's my
   job.json, it's erroring on api_name, what's wrong", "add a dead-letter
   queue to this existing job using standard-assets"), run with/without-skill
   comparisons, and iterate on feedback before considering this done.
