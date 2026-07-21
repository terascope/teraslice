# Reference: apis

**Authoritative, always-current source — `WebFetch` this:**
`https://terascope.github.io/teraslice/docs/jobs/configuration` (the `apis`
section) and
`https://terascope.github.io/teraslice/docs/jobs/types-of-operations` (what an
Operation API / Observer is).

## What `apis` is for

The top-level `apis` array declares reusable API instances that operations can
share — a reader/sender API, a utility API, or a **Dead Letter Queue**. Unlike
`operations`, **no apis are required**; the array may be empty.

## Rules

- Each api is an object with a **required, unique `_name`**.
- `_name` may be suffixed with a tag using `:` — e.g. `"example:foo"`. Only
  the part before the last `:` (after any `@asset` identifier) is used to find
  the file/folder; the tag just makes the instance distinct. This lets you
  declare **multiple instances of the same api** with different configs.
- Duplicate `_name` values throw on submission.
- An op references an api instance via **`api_name`** *or* **`_api_name`**
  (see below), matching the api's `_name` exactly (tag included).

## `api_name` vs `_api_name` — two referencing styles

Which field an op uses to point at its api **depends on the asset**, so check
the op's own docs. Two patterns show up:

- **`api_name` (fields also on the op)** — the "classic" elasticsearch-assets
  style. The op still carries its own config fields; the api is an optional
  shared instance. See the cross-referencing example below.
- **`_api_name` (all config ON the api, op is bare)** — the "API-first" style
  used by **kafka-assets** (`kafka_sender`, `kafka_reader`) and newer
  elasticsearch senders. **All** config (topic, connection, size, …) lives on
  the `apis` entry; the op is just `{ "_op": "...", "_api_name": "..." }`.
  Putting config on the op instead of the api is silently ignored here.

Both forms must resolve to a declared api `_name` — `lint-job.mjs` cross-checks
both and errors on a dangling reference.

### Verified API-first example — data_generator → kafka_sender

Confirmed working end-to-end (kafka-assets v6, `standard` v2). Note config is
entirely on the api; the op only names it via `_api_name`:

```json
{
  "name": "datagen-to-kafka",
  "lifecycle": "once",
  "workers": 1,
  "assets": ["standard", "kafka"],
  "apis": [
    { "_name": "kafka_sender_api", "topic": "gen-data", "connection": "default", "size": 10000, "compression": "gzip" }
  ],
  "operations": [
    { "_op": "data_generator", "size": 5000 },
    { "_op": "kafka_sender", "_api_name": "kafka_sender_api" }
  ]
}
```

`connection` names a terafoundation connector (`"default"` on most clusters);
the kafka topic is auto-created on first send. In `lifecycle: once`,
`data_generator`'s `size` is the **total** records; in `persistent` it's
records **per slice**.

## Cross-referencing example

```json
{
  "apis": [
    { "_name": "elasticsearch_reader_api:foo", "index": "idx-a", "size": 10000, "date_field_name": "created" },
    { "_name": "elasticsearch_reader_api:bar", "index": "idx-b", "size": 20000, "date_field_name": "_ingest" }
  ],
  "operations": [
    { "_op": "elasticsearch_reader", "api_name": "elasticsearch_reader_api:foo", "index": "idx-a", "size": 10000, "date_field_name": "created" },
    { "_op": "example_op", "api_name": "elasticsearch_reader_api:bar" }
  ]
}
```

## Name collisions across assets

APIs follow the same `@<asset-identifier>` disambiguation as operations (see
`operations.md`), and allow an extra trailing tag:
`elasticsearch_sender_api@elasticsearch:4.0.5`, or with a tag
`some_api@someAsset:1.1.0:foo`.

## Dead Letter Queue

`_dead_letter_action` on an op can be `throw` / `log` / `none`, **or** the
`_name` of a DLQ api declared in `apis` (e.g. `kafka_dead_letter` from
kafka-assets). The DLQ api must be created by an operation before it can be
used. Details:
`https://terascope.github.io/teraslice/docs/jobs/dead-letter-queue`.
