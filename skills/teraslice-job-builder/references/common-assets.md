# Reference: common external asset bundles

> **Higher staleness risk.** These bundles live in their own repos and ship on
> their own release cadence. The op names below are stable landmarks, but for
> **any op's config fields, and for version-specific behavior, `WebFetch` the
> bundle's own docs** — don't trust a cached field list here.

An op is only available if its asset bundle is **listed in the job's `assets`
and installed on the cluster**. Confirm with the user which bundles their
cluster has.

## elasticsearch-assets

Docs: `https://terascope.github.io/elasticsearch-assets`
(per-op pages under `/docs/asset/operations/<op>`)

- **Readers:** `elasticsearch_reader`, `id_reader`, `spaces_reader`
- **Sender:** `elasticsearch_bulk`
- **APIs:** `elasticsearch_reader_api`, `elasticsearch_sender_api`,
  `elasticsearch_state_storage`, `spaces_reader_api`

## standard-assets

Docs: `https://terascope.github.io/standard-assets`

- **Generate:** `data_generator`
- **Field ops:** `copy_field`, `drop_field`, `set_field`, `add_key`,
  `remove_key`
- **Filtering:** `filter`, `filter_by_date`, `filter_by_required_fields`
- **Aggregation:** `accumulate`, `count_by_field`, `count_unique`, `group_by`
- **Routing:** `field_router`, `hash_router`, `key_router`, `date_router`
- **Sampling:** `sample_random`, `sample_exact`
- **Output:** `stdout`, `output`

## kafka-assets

Docs: `https://terascope.github.io/kafka-assets`

- **Reader:** `kafka_reader`
- **Sender:** `kafka_sender`
- **DLQ:** `kafka_dead_letter` (usable as an op's `_dead_letter_action`)

## file-assets

Docs: `https://terascope.github.io/file-assets`

- **Readers:** `file_reader`, `s3_reader`
- **Senders:** `file_sender`, `s3_sender`

## chaos-assets

Repo: `https://github.com/terascope/chaos-assets` — fault-injection ops for
resilience testing.
