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
- An op references an api instance via **`_api_name`** (underscore-prefixed),
  matching the api's `_name` exactly (tag included).

## Referencing an api from an op — `_api_name`

An op links to a declared api instance with the meta field **`_api_name`**,
matching the api's `_name` exactly (tag included). Every asset uses it —
elasticsearch-assets (`elasticsearch_reader`) and kafka-assets (`kafka_sender`,
`kafka_reader`).

The dominant pattern is **API-first**: put the config (index, topic,
`_connection`, size, …) on the `apis` entry, and leave the op bare —
`{ "_op": "...", "_api_name": "..." }`.

> Note the underscore convention: meta fields the framework consumes are
> underscore-prefixed — `_op`, `_api_name`, `_connection`, `_encoding`,
> `_dead_letter_action`. An op's own **data** fields are not (`index`, `topic`,
> `size`, `date_field_name`).
>
> This skill targets **Teraslice v3**. The old bare `api_name` was the v2
> field; v3 renamed it to `_api_name`. v2 is out of support — always write
> `_api_name`, never `api_name`.

The `_api_name` must resolve to a declared api `_name` — `lint-job.mjs`
cross-checks it and errors on a dangling reference.

### API-first example — data_generator → kafka_sender

Config is entirely on the api; the op only names it via `_api_name`:

```json
{
  "name": "datagen-to-kafka",
  "lifecycle": "once",
  "workers": 1,
  "assets": ["standard", "kafka"],
  "apis": [
    { "_name": "kafka_sender_api", "topic": "gen-data", "_connection": "default", "size": 10000, "compression": "gzip" }
  ],
  "operations": [
    { "_op": "data_generator", "size": 5000 },
    { "_op": "kafka_sender", "_api_name": "kafka_sender_api" }
  ]
}
```

`_connection` names a terafoundation connector (`"default"` on most clusters);
the kafka topic is auto-created on first send. In `lifecycle: once`,
`data_generator`'s `size` is the **total** records; in `persistent` it's
records **per slice**.

## Multiple instances of the same api (tagged `_name`)

Declare each instance under a tagged `_name` and point each op at the tag via
`_api_name`. Config lives on the api entry, not the op:

```json
{
  "apis": [
    { "_name": "elasticsearch_reader_api:foo", "index": "idx-a", "size": 10000, "date_field_name": "created", "_connection": "es-1" },
    { "_name": "elasticsearch_reader_api:bar", "index": "idx-b", "size": 20000, "date_field_name": "created", "_connection": "es-1" }
  ],
  "operations": [
    { "_op": "elasticsearch_reader", "_api_name": "elasticsearch_reader_api:foo" },
    { "_op": "example_op", "_api_name": "elasticsearch_reader_api:bar" }
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
