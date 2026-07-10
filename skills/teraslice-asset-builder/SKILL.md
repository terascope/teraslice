---
name: teraslice-asset-builder
description: Interactively scaffold a Teraslice asset — either add a new operation (reader, processor, sender, or API) to an existing asset bundle, or scaffold a brand-new asset bundle repo from scratch. Use whenever the user wants to build, create, or scaffold a Teraslice asset, operation, processor, reader, slicer, fetcher, sender, or op-API, or asks to "make an asset". Walks the user through operation type, config schema, and behavior, then generates the source, registry entry, and test files following Terascope conventions.
---

# Teraslice Asset Builder

Walk the user through building a Teraslice asset, then generate the files. Do **not** dump questions all at once — ask in focused rounds, propose sensible defaults, and confirm before writing files.

An **asset** is a deployable bundle of Teraslice **operations**. A bundle repo (e.g. `elasticsearch-assets`, `standard-assets`) contains many operations under `asset/src/<operation_name>/`. Existing bundles for reference live at `/Users/jsoto/Workspace/TerasliceAssets/` (e.g. `standard-assets`, `elasticsearch-assets`, `file-assets`, `kafka-assets`). Read a sibling operation there before writing a new one — matching the surrounding style matters more than the templates in this skill.

## Step 0 — Does a public bundle already cover this?

**Do this first, before deciding to build anything.** Terascope maintains public asset bundles for the common data sources (Elasticsearch/OpenSearch, Kafka, files+S3, generic processors, chaos/testing). Read `references/public-assets.md` for the list and GitHub URLs.

If the request maps to one of those data sources (e.g. "an Elasticsearch reader", "write to Kafka", "an S3 exporter", "a dedupe processor"):

1. **Tell the user a public bundle already covers that source** — they likely don't need a new bundle.
2. **Ask what they specifically need** — the whole reader/writer (probably already exists → point them at it), or a *specific new operation* the bundle lacks?
3. **Read the live repo before building.** These bundles get new processors constantly, so don't rely on any static list — WebFetch the bundle's GitHub repo (README, `docs/`, and the `asset/src/` tree), or read the local clone under `/Users/jsoto/Workspace/TerasliceAssets/<bundle>/` if present, and confirm what operations currently exist. If one already aligns, point to it instead of duplicating.
4. If the operation genuinely doesn't exist, **add it inside that existing bundle** (Step 2), matching its conventions — don't spin up a new bundle.

Only proceed to a brand-new bundle (Step 1) when the data source has **no** public bundle (e.g. a database with no existing asset).

## Step 1 — New operation, or new bundle?

Determine which the user wants:

- **New operation in an existing bundle** (most common) → Step 2.
- **New bundle from scratch** (only when no public bundle fits — see Step 0) → read `references/new-bundle.md`, scaffold the repo, then return to Step 2 to add the first operation. If the bundle talks to an external service (database, queue, object store), it also needs an in-repo API package + a Dockerfile that layers it onto the Teraslice image — read `references/api-package-and-docker.md`.

Ask where the target bundle lives if it isn't obvious. Default search location is `/Users/jsoto/Workspace/TerasliceAssets/`. Confirm the absolute path before writing anything.

## Step 2 — Gather requirements

Ask, in order (skip anything already stated):

1. **Operation name** — `snake_case` (e.g. `add_uuid`, `redis_reader`). This becomes the `_op` value used in job configs and the directory name.
2. **Operation type** — see `references/operation-types.md` for the full menu and when to pick each. The short version:
   - **Reader** = a `Slicer` (creates slices on the exec controller) + a `Fetcher` (reads data on workers). Pick when the op is the *source* of data.
   - **Processor** — transforms/writes data. Sub-variants: `MapProcessor` (mutate one record), `EachProcessor` (side-effects only), `FilterProcessor` (keep/drop records), `BatchProcessor` (whole array at once, also used for senders/writers).
   - **API** — `OperationAPI` (utility exposed to other ops), `APIFactory` (factory returning `{ client, config }`, used by reader/sender APIs), or `Observer` (monitors, mutates nothing).
3. **Config schema** — what `opConfig` fields does it need? For each: name, purpose (`doc`), `default`, and `format` (e.g. `required_string`, `Boolean`, `Number`, or a custom validator). See `references/operation-types.md` for schema conventions.
4. **Behavior** — what should the core method actually do? Get enough detail to write a real first implementation, not a stub.

Restate the plan in one short block and get a yes before writing.

## Step 3 — Generate files

Create under `asset/src/<operation_name>/`:

- Implementation file(s): `processor.ts`, or `fetcher.ts` + `slicer.ts` for a reader, or `api.ts` for an API.
- `schema.ts` — the config schema.
- `interfaces.ts` — the `OpConfig`-extending config interface (only if the op has custom config fields; small ops sometimes skip it).

Use the templates in `references/operation-types.md`, but adapt imports and style to what the target bundle actually uses (check a sibling op — e.g. some use `@terascope/core-utils`, older ones use `@terascope/utils`).

## Step 4 — Register the operation

Every operation must be registered in `asset/src/index.ts` (the "registry"), which maps the op name to its classes:

```ts
export const ASSETS = {
    my_operation: {
        Processor: MyOperation,      // or Fetcher + Slicer, or API
        Schema: MyOperationSchema,
    },
    // ...
};
```

This file is auto-generated. Prefer regenerating it with `teraslice-cli assets registry` (or the bundle's own registry script). If the CLI isn't available, add the import + `ASSETS` entry by hand, matching the existing formatting. The header comment warns manual edits are lost on regen — mention that.

## Step 5 — Tests

Offer to scaffold tests. Teraslice uses `teraslice-test-harness` (`WorkerTestHarness` for processors/fetchers, `SlicerTestHarness` for slicers). See `references/testing.md`. Place them at `test/<operation_name>/processor-spec.ts` and `schema-spec.ts`.

## Step 6 — Build & verify

Tell the user how to build and test (adapt to the repo's `package.json` scripts):

```bash
pnpm run build        # tsc build — confirms it compiles
pnpm test             # run the suite (some bundles need Docker for integration tests)
```

To package/deploy the asset:

```bash
teraslice-cli assets build                 # zips into build/
teraslice-cli assets deploy <cluster> --build
```

Do not run build/deploy yourself unless asked — surface the commands and let the user run them.
