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
- An op references an api instance via its own **`api_name`** field, matching
  the api's `_name` exactly (tag included).

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
