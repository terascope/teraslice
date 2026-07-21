# Reference: operations

**Authoritative, always-current source — `WebFetch` this:**
`https://terascope.github.io/teraslice/docs/jobs/types-of-operations`

Also relevant:
`https://terascope.github.io/teraslice/docs/jobs/configuration` (generic op
fields + name-collision syntax) and
`https://terascope.github.io/teraslice/docs/jobs/slices` (how a reader chunks
data).

## Ordering convention

`operations` is an **ordered pipeline**:

1. **Reader** — always first. A reader = a **Slicer** (runs on the Execution
   Controller, creates slices) + a **Fetcher** (runs on a Worker, reads each
   slice's data). Examples: `elasticsearch_reader`, `kafka_reader`,
   `file_reader`, `data_generator`, `test-reader`.
2. **Processors** — zero or more, in the middle. Transform, enrich, or filter.
3. **Sender** — typically last, writes to a destination. Examples:
   `elasticsearch_bulk`, `kafka_sender`, `s3_sender`. A sender is just a
   processor that writes out; `stdout`/`noop` can stand in during development.

**Hard rule:** `operations` must contain **at least 2 entries**. A reader
alone is invalid.

## Processor variants

When picking or reviewing a processor, know which base it extends (fetch the
op's docs to confirm):

- **BatchProcessor** — `onBatch(records)` → returns modified array. Whole
  batch at once.
- **EachProcessor** — `forEach(record)` → side-effects only, returns nothing.
- **MapProcessor** — `map(record)` → returns one modified record.
- **FilterProcessor** — `filter(record)` → boolean; drops records that
  return false.

## Generic per-op fields

| Field | Default | Notes |
|---|---|---|
| `_op` | — | **Required.** Exact operation name (file/folder name) |
| `_encoding` | `"json"` | Encoding for `DataEntity.fromBuffer` |
| `_dead_letter_action` | `"throw"` | `throw` \| `log` \| `none`, or a registered DLQ API name — see `apis.md` and the dead-letter-queue doc |

All other fields on an op come from that op's own schema in its asset bundle.

## Asset / op name-collision syntax

If two listed `assets` both define an op (or api) with the same name,
Teraslice can't tell which to load and **throws on submission**. Disambiguate
with `@<asset-identifier>`, where the identifier matches how you listed the
asset in `assets`:

- Asset listed as `standard` → `filter@standard`
- Asset listed as `standard:3.2.0` → `filter@standard:3.2.0`
- Asset listed by hash `2ab55a02...` → `filter@2ab55a02...`

APIs follow the same convention and additionally allow a trailing tag:
`some_api@someAsset:1.1.0:foo`.

You only need the `@asset` suffix when there's an actual collision — for a
uniquely-named op it's optional.
