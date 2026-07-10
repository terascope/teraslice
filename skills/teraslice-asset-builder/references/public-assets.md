# Public Teraslice Asset Bundles

Terascope maintains a set of public asset bundles. **Before scaffolding anything for a common data source (Elasticsearch/OpenSearch, Kafka, files, S3) or a generic transform, check whether one of these already covers it** — the bundle probably already exists, and the right move is usually to add an operation to it (or just use it) rather than build a new bundle from scratch.

> **These bundles are updated constantly** — new processors and operations land all the time. **Do not trust a hard-coded operation list.** Always read the **live repo** (via WebFetch on the GitHub URL below — check the README, the `docs/` folder, and the `asset/src/` tree) to see what operations currently exist before telling the user something does or doesn't exist.

| Bundle | Covers | GitHub (read this for current operations) |
|--------|--------|-------------------------------------------|
| **elasticsearch-assets** | Reading from / writing to Elasticsearch & OpenSearch (also Terascope Spaces). | https://github.com/terascope/elasticsearch-assets |
| **kafka-assets** | Reading from / writing to Apache Kafka topics. | https://github.com/terascope/kafka-assets |
| **file-assets** | Reading from / writing to local files **and S3-compatible object storage**. | https://github.com/terascope/file-assets |
| **chaos-assets** | Developer/testing utilities: fault injection, forced errors, OOM, queue-buster stress tests. | https://github.com/terascope/chaos-assets |
| **standard-assets** | Generic, source-agnostic processors: filter, transform, dedupe, routing, aggregation, sampling, data generation. | https://github.com/terascope/standard-assets |

If a bundle is also cloned locally under `/Users/jsoto/Workspace/TerasliceAssets/<bundle>/`, its `asset/src/` on disk is the fastest way to see current operations — but the GitHub repo is the source of truth for what's been released.

## How to use this when a user asks to build for one of these sources

1. **Recognize the overlap.** If the request maps to a bundle above (e.g. "an Elasticsearch reader", "write to Kafka", "an S3 exporter", "a generic dedupe processor"), say so up front: a public bundle already covers that source — you usually don't need a new bundle.
2. **Ask what specifically they need.** Is it the whole reader/writer (probably already exists — point them at it), or a *specific new operation/processor* the bundle doesn't have yet?
3. **Look it up on the live repo before building.** WebFetch the relevant GitHub repo (README + `docs/` + `asset/src/` tree), or read the local clone if present. Confirm whether an operation already aligns with what they want.
   - If it already exists → point them to it instead of duplicating.
   - If it doesn't → continue.
4. **If it genuinely doesn't exist, add it to that bundle.** Scaffold the new operation *inside the existing bundle* (the normal "new operation" flow, Step 2), matching that bundle's conventions — not a brand-new bundle. Only scaffold a new bundle when the data source has no public bundle at all (e.g. a database the org has no asset for yet).
