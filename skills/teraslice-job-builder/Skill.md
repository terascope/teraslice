---
name: teraslice-job-builder
description: >-
  Author, review, lint, and validate a Teraslice job.json — the config that
  defines a job's lifecycle, workers, assets, and its pipeline of operations
  (one reader, zero-or-more processors, one sender) plus reusable apis. Use
  when a user wants to build a new Teraslice job, fix or review an existing
  job.json, understand a job config error (e.g. api_name, asset/op name
  collisions, missing _op), or pick the right operations/asset bundles for a
  pipeline. Does not deploy the job — it hands off a validated job.json and
  the teraslice-cli command to register it.
---

# Teraslice job builder

A Teraslice **job** is a JSON config describing a data pipeline: a
`lifecycle`, some `workers`, the `assets` (processor bundles) it needs, and an
ordered `operations` array — one **reader** first, zero or more **processors**
in the middle, and typically a **sender** last — plus any reusable `apis`.

This skill helps you **author, lint, and validate** a `job.json`. It does
**not** register or start the job against a cluster; when the config is ready
it hands you the `teraslice-cli` command to run yourself.

## Documentation is fetched live — don't rely on stale copies

This skill's `references/` files are **pointers**, not full copies. They carry
a small cheat-sheet of stable facts, but for anything version-specific, any
full field list, or any operation config you're unsure about, **`WebFetch` the
live doc URL** — it's always current with the published docs. Prefer fetching
over guessing.

| Topic | Live URL to `WebFetch` |
|---|---|
| Job overview | `https://terascope.github.io/teraslice/docs/jobs/overview` |
| Top-level job config (all fields, examples, name collisions) | `https://terascope.github.io/teraslice/docs/jobs/configuration` |
| Types of operations (reader/slicer/fetcher, processor variants, apis) | `https://terascope.github.io/teraslice/docs/jobs/types-of-operations` |
| Built-in ops (`script`, `stdout`, `noop`, `delay`, `test-reader`) | `https://terascope.github.io/teraslice/docs/jobs/builtin-operations` |
| Dead letter queue (`_dead_letter_action`) | `https://terascope.github.io/teraslice/docs/jobs/dead-letter-queue` |
| Slices / how a reader chunks data | `https://terascope.github.io/teraslice/docs/jobs/slices` |
| Asset bundles overview | `https://terascope.github.io/teraslice/docs/asset-bundles` |

**External asset bundles** (separate sites — fetch these for op-specific fields):

| Bundle | Docs site | Common ops |
|---|---|---|
| elasticsearch-assets | `https://terascope.github.io/elasticsearch-assets` (ops under `/docs/asset/operations/<op>`) | `elasticsearch_reader`, `elasticsearch_bulk`, `id_reader`, `spaces_reader` |
| standard-assets | `https://terascope.github.io/standard-assets` | `data_generator`, `filter`, `set_field`, `group_by`, routers, samplers |
| kafka-assets | `https://terascope.github.io/kafka-assets` | `kafka_reader`, `kafka_sender`, `kafka_dead_letter` |
| file-assets | `https://terascope.github.io/file-assets` | `file_reader`, `file_sender`, `s3_reader`, `s3_sender` |
| chaos-assets | `https://github.com/terascope/chaos-assets` | fault-injection ops for testing |

## Workflow

1. **Gather requirements.** Ask the user:
   - **Lifecycle**: `once` (batch — runs to completion then exits) or
     `persistent` (streaming — runs until stopped)?
   - **Data source** (→ reader) and **destination** (→ sender).
   - **Transforms** needed in between (→ processors).
   - Rough **volume / worker count**.
   - **Which asset bundles their cluster actually has installed** — this
     constrains the operations available. If unknown, note it; the job can't
     use an op from an uninstalled asset.

2. **Pick operations.** Reader first, processors in the middle, sender last.
   Consult `references/operations.md` and `references/builtin-operations.md`;
   for external bundle ops, `WebFetch` the bundle's site (table above).
   `references/common-assets.md` is the cheat sheet for what lives where.

3. **Assemble the job.json.** Start from the closest skeleton in
   `assets/templates/` (batch-once vs persistent-streaming vs custom-asset)
   rather than from scratch. Fill fields per `references/job-schema.md`
   (fetch the configuration page for the authoritative list).

4. **Lint early and often.** After every edit, run:
   ```
   node scripts/lint-job.mjs path/to/job.json
   ```
   Zero-dependency structural check — safe to run anywhere. Fix what it flags
   before moving on.

5. **Deep-validate before handoff.** When the user is ready to test/register:
   ```
   node scripts/deep-validate-job.mjs path/to/job.json
   ```
   Runs the real `JobValidator` **if** `@terascope/job-components` is
   resolvable (inside a teraslice checkout, or installed as a dep). If not, it
   reports clearly what it skipped — don't claim the job is fully validated
   when only the lint ran.

6. **Handoff — do NOT deploy.** Tell the user the command to run themselves:
   ```
   teraslice-cli tjm register <cluster-alias> path/to/job.json
   # add --start to register and start in one step
   ```
   This skill has no cluster credentials and does not register jobs.

## Reference index

| File | Open it when |
|---|---|
| `references/job-schema.md` | Filling top-level fields (`lifecycle`, `workers`, `assets`, `apis`, k8s resource fields, etc.) |
| `references/operations.md` | Ordering ops, choosing processor variants, generic op fields (`_op`, `_encoding`, `_dead_letter_action`), asset/op name-collision syntax |
| `references/apis.md` | Declaring `apis` and cross-referencing them from ops via `api_name` |
| `references/builtin-operations.md` | Using core ops that need no asset bundle |
| `references/common-assets.md` | Choosing an external asset bundle and its common ops |

## Limitations

- **External asset bundle details live in other repos** and change on their
  own release cadence. Treat any version-specific field from
  `common-assets.md` as "verify against the bundle's own docs" — fetch the
  live site rather than trusting a cached field list.
- **Deep validation is strongest on top-level job fields.** Per-operation
  schema validation needs that op's asset resolvable locally, so op-specific
  fields from bundles the user hasn't installed won't be fully checked. The
  real final check is registering against an actual cluster.
- This skill **authors and validates only** — it does not register, start,
  stop, or deploy jobs.
