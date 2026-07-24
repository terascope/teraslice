---
title: Data Types
sidebar_label: Overview
---

> A library for defining the data structures and mapping, exports to Opensearch Mappings, GraphQL, xLucene, and more.

## Installation

```bash
# Using pnpm
pnpm add @terascope/data-types
# Using npm
npm install --save @terascope/data-types
```

## Core classes

- [`DataType`](./api/data-type/classes/DataType.md) — the entry point. Build one
  from a `DataTypeConfig` (a `version` plus a map of field names to their type
  configs), then convert it with `toESMapping()`, `toGraphQL()`, or
  `toXlucene()`. See [Examples](#examples) below.
- [`BaseType`](./api/types/base-type/classes/default.md) — the abstract base
  every field type extends. It defines the `toESMapping` / `toGraphQL` /
  `toXlucene` contract that each [field type](#field-types) implements.
- [`GroupType`](./api/types/group-type/classes/default.md) — represents an
  `Object` field together with its dot-notation children as a single nested
  unit (assembled internally, not declared directly).
- [`TupleType`](./api/types/tuple-type/classes/default.md) — represents a
  `Tuple` field: an ordered set of values, each element its own type.

## Field Types

Each field in a `DataTypeConfig` is declared with a `FieldType` — the name you
write in `{ type: '...' }` (or `FieldType.X`). The types are grouped below by
purpose; follow a link for the full mapping/GraphQL/xLucene details of each.

### Numeric

- [`Byte`](./api/types/v1/byte/classes/default.md) — 8-bit signed integer (ES `byte`).
- [`Short`](./api/types/v1/short/classes/default.md) — 16-bit signed integer (ES `short`).
- [`Integer`](./api/types/v1/integer/classes/default.md) — 32-bit signed integer (ES `integer`).
- [`Long`](./api/types/v1/long/classes/default.md) — 64-bit signed integer (ES `long`; GraphQL `Float`).
- [`Float`](./api/types/v1/float/classes/default.md) — single-precision float (ES `float`).
- [`Double`](./api/types/v1/double/classes/default.md) — double-precision float (ES `double`).
- [`Number`](./api/types/v1/number/classes/default.md) — general-purpose numeric when the width doesn't matter (ES `double`).

### String / keyword / text

See [Choosing a string type](#choosing-a-string-type) below for how to pick between these.

- [`Keyword`](./api/types/v1/keyword/classes/default.md) — exact-match string for filtering, sorting, aggregations.
- [`String`](./api/types/v1/string/classes/default.md) — like `Keyword`, but always GraphQL `String` (no `_key`→`ID` special-case).
- [`Text`](./api/types/v1/text/classes/default.md) — analyzed full-text string.
- [`KeywordCaseInsensitive`](./api/types/v1/keyword-case-insensitive/classes/default.md) — case-insensitive exact match.
- [`KeywordTokens`](./api/types/v1/keyword-tokens/classes/default.md) — exact match plus a tokenized sub-field for word search.
- [`KeywordTokensCaseInsensitive`](./api/types/v1/keyword-tokens-case-insensitive/classes/default.md) — case-insensitive exact match plus word search.
- [`KeywordPathAnalyzer`](./api/types/v1/keyword-path-analyzer/classes/default.md) — slash-delimited paths, matchable by segment.
- [`NgramTokens`](./api/types/v1/ngram-tokens/classes/default.md) — substring matching over numeric strings (3-gram, digits only).

### Boolean / binary

- [`Boolean`](./api/types/v1/boolean/classes/default.md) — `true`/`false` (ES `boolean`).
- [`Binary`](./api/types/v1/binary/classes/default.md) — Base64-encoded binary value (ES `binary`).

### Date

- [`Date`](./api/types/v1/date/classes/default.md) — date/time (ES `date`; xLucene `Date`).

### Geo

- [`GeoPoint`](./api/types/v1/geo-point/classes/default.md) — a single lat/lon point (ES `geo_point`).
- [`GeoJSON`](./api/types/v1/geo-json/classes/default.md) — arbitrary GeoJSON geometry (ES `geo_shape`).
- [`Boundary`](./api/types/v1/boundary/classes/default.md) — a lat/lon boundary object.
- [`Geo`](./api/types/v1/geo/classes/default.md) — **deprecated**; use `GeoPoint` or `GeoJSON`.

### Network

- [`IP`](./api/types/v1/ip/classes/default.md) — IPv4/IPv6 address (ES `ip`).
- [`IPRange`](./api/types/v1/ip-range/classes/default.md) — CIDR range (ES `ip_range`).
- [`Hostname`](./api/types/v1/hostname/classes/default.md) — hostname, matched case-insensitively and by label.
- [`Domain`](./api/types/v1/domain/classes/default.md) — domain name, matched by suffix.

### Complex / other

- [`Object`](./api/types/v1/object/classes/default.md) — nested object; declare children with dot-notation names.
- [`Vector`](./api/types/v1/vector/classes/default.md) — ML embedding vector (ES `knn_vector`; enables `index.knn`).
- [`Any`](./api/types/v1/any/classes/default.md) — unindexed, free-form value (`{ enabled: false }`).
- [`Tuple`](./api/types/tuple-type/classes/default.md) — an ordered set of values, each element its own type.

## Choosing a string type

Most fields that hold text map to a handful of `keyword`/`text` variants. They
differ mainly in **how the value is indexed** — exact vs. analyzed — and
therefore in **what queries they support**. A `keyword` is stored verbatim and
is good for filtering, sorting, and aggregations; a `text` value is run through
an analyzer (tokenized/lowercased) and is good for full-text search but *not*
for exact match, sorting, or aggregations. The analyzer variants below layer
case-insensitivity, tokenization, or a domain-specific analyzer on top.

Quick guide:

- **Exact match, sorting, aggregations** → [`keyword`](./api/types/v1/keyword/classes/default.md)
  (or [`string`](./api/types/v1/string/classes/default.md), which is identical
  but always maps to GraphQL `String` — `keyword` maps a `_key` field to `ID`).
- **Full-text search** on free-form prose → [`text`](./api/types/v1/text/classes/default.md).
- **Both exact match *and* word-level search** → [`keyword-tokens`](./api/types/v1/keyword-tokens/classes/default.md)
  (query `field` for exact, `field.tokens` for words).
- **Case-insensitive exact match** (usernames, codes) → [`keyword-case-insensitive`](./api/types/v1/keyword-case-insensitive/classes/default.md).
- **Case-insensitive *and* word-level search** → [`keyword-tokens-case-insensitive`](./api/types/v1/keyword-tokens-case-insensitive/classes/default.md).
- **Slash-delimited paths** (file paths, URL paths), matching on segments →
  [`keyword-path-analyzer`](./api/types/v1/keyword-path-analyzer/classes/default.md).
- **Substring matching over numeric strings** (phone/account numbers) →
  [`ngram-tokens`](./api/types/v1/ngram-tokens/classes/default.md).
- **Hostnames**, matched case-insensitively and by label →
  [`hostname`](./api/types/v1/hostname/classes/default.md).
- **Domain names**, matched by suffix (`com`, `example.com`, …) →
  [`domain`](./api/types/v1/domain/classes/default.md).

| Type | Reach for it when | ES/OpenSearch mapping | Exact match | Full-text / partial |
| ---- | ----------------- | --------------------- | :---------: | ------------------- |
| [`keyword`](./api/types/v1/keyword/classes/default.md) | Exact values you filter, sort, or aggregate on | `keyword` | ✅ | — |
| [`string`](./api/types/v1/string/classes/default.md) | Same as `keyword`, no `_key`→`ID` GraphQL special-case | `keyword` | ✅ | — |
| [`text`](./api/types/v1/text/classes/default.md) | Free-form prose you search over | `text` (standard analyzer) | — | words |
| [`keyword-tokens`](./api/types/v1/keyword-tokens/classes/default.md) | Need exact match *and* word search on one field | `keyword` + `tokens` text sub-field | ✅ | words (on `.tokens`) |
| [`keyword-case-insensitive`](./api/types/v1/keyword-case-insensitive/classes/default.md) | Exact match ignoring case | `text` w/ `lowercase_keyword_analyzer` (or `keyword` + sub-field via `use_fields_hack`) | ✅ (case-insensitive) | — |
| [`keyword-tokens-case-insensitive`](./api/types/v1/keyword-tokens-case-insensitive/classes/default.md) | Case-insensitive exact *and* word search | `text` w/ `lowercase_keyword_analyzer` + `tokens` sub-field | ✅ (case-insensitive) | words (on `.tokens`) |
| [`keyword-path-analyzer`](./api/types/v1/keyword-path-analyzer/classes/default.md) | Slash-delimited paths, match by segment | `keyword` + `tokens` sub-field (`/` pattern analyzer) | ✅ | path segments (on `.tokens`) |
| [`ngram-tokens`](./api/types/v1/ngram-tokens/classes/default.md) | Substring matches on numeric strings | `keyword` + `tokens` sub-field (3-gram, digits only) | ✅ | substrings (on `.tokens`) |
| [`hostname`](./api/types/v1/hostname/classes/default.md) | Hostnames, case-insensitive + per-label | `text` w/ `lowercase_keyword_analyzer` + `tokens` sub-field (`.` pattern) | ✅ (case-insensitive) | labels (on `.tokens`) |
| [`domain`](./api/types/v1/domain/classes/default.md) | Domain names, match by suffix | `text` w/ `lowercase_keyword_analyzer` + `tokens` and `right` sub-fields | ✅ (case-insensitive) | suffixes (on `.right`), words (on `.tokens`) |

All of these map to the GraphQL `String` scalar. For xLucene, the plain
`keyword`/`text`/tokenized variants report `String`; `keyword-case-insensitive`
and `domain` report `AnalyzedString`.

## Examples

A `DataType` is built from a `DataTypeConfig` — a `version` plus a map of field
names to their type configs. Once constructed it can be converted to an
Elasticsearch/OpenSearch mapping, a GraphQL schema, or an xLucene type config.

### A basic record

```ts
import { DataType } from '@terascope/data-types';
import { FieldType } from '@terascope/types';

const dataType = new DataType({
    version: 1,
    fields: {
        hello: { type: FieldType.Text },
        location: { type: FieldType.GeoPoint },
        date: { type: FieldType.Date },
        ip: { type: FieldType.IP },
        someNum: { type: FieldType.Long },
    },
}, 'Event');
```

**`dataType.toESMapping()`** — an OpenSearch mapping (defaults shown; pass
`distribution`/`majorVersion` to target a specific engine):

```json
{
  "settings": {},
  "mappings": {
    "dynamic": false,
    "properties": {
      "date": { "type": "date" },
      "hello": { "type": "text" },
      "ip": { "type": "ip" },
      "location": { "type": "geo_point" },
      "someNum": { "type": "long" }
    }
  }
}
```

**`dataType.toGraphQL()`** — note that `GeoPoint` expands into a reusable custom
type and that `Long` maps to GraphQL `Float`:

```graphql
type DTGeoPointV1 {
  lat: String!
  lon: String!
}

type Event {
  date: String
  hello: String
  ip: String
  location: DTGeoPointV1
  someNum: Float
}
```

**`dataType.toXlucene()`** — the field-type config consumed by xLucene queries:

```json
{
  "date": "date",
  "hello": "string",
  "ip": "ip",
  "location": "geo-point",
  "someNum": "integer"
}
```

### Analyzers, settings, and vectors

Some types contribute index `settings` (custom analyzers/tokenizers) or require
an engine feature flag. Here a case-insensitive tokenized keyword and a
path-hierarchy field add analyzers, while a `Vector` field turns on `index.knn`:

```ts
const dataType = new DataType({
    version: 1,
    fields: {
        name: { type: FieldType.KeywordTokensCaseInsensitive },
        path: { type: FieldType.KeywordPathAnalyzer },
        embedding: {
            type: FieldType.Vector,
            array: true,
            dimension: 3,
            space_type: 'l2',
        },
    },
}, 'Document');
```

**`dataType.toESMapping({ majorVersion: 3 })`** (OpenSearch 3.x):

```json
{
  "settings": {
    "index.knn": true,
    "analysis": {
      "analyzer": {
        "lowercase_keyword_analyzer": { "tokenizer": "keyword", "filter": "lowercase" },
        "path_analyzer": { "type": "custom", "tokenizer": "path_tokenizer" }
      },
      "tokenizer": {
        "path_tokenizer": { "type": "pattern", "pattern": "/" }
      }
    }
  },
  "mappings": {
    "dynamic": false,
    "properties": {
      "embedding": {
        "type": "knn_vector",
        "space_type": "l2",
        "dimension": 3,
        "method": { "name": "hnsw", "engine": "faiss" }
      },
      "name": {
        "type": "text",
        "analyzer": "lowercase_keyword_analyzer",
        "fields": { "tokens": { "type": "text", "analyzer": "standard" } }
      },
      "path": {
        "type": "keyword",
        "fields": { "tokens": { "type": "text", "analyzer": "path_analyzer" } }
      }
    }
  }
}
```

**`dataType.toGraphQL()`** — the `array: true` on `embedding` produces a list:

```graphql
type Document {
  embedding: [Float]
  name: String
  path: String
}
```

**`dataType.toXlucene()`**:

```json
{
  "embedding": "float",
  "name": "string",
  "path": "string"
}
```

### Nested objects

Declare an `Object` field and then its child fields with dot-notation names.
Children are grouped under the parent in every output format:

```ts
const dataType = new DataType({
    version: 1,
    fields: {
        user: { type: FieldType.Object },
        'user.id': { type: FieldType.Keyword },
        'user.tags': { type: FieldType.Keyword, array: true },
    },
}, 'Account');
```

**`dataType.toESMapping()`**:

```json
{
  "settings": {},
  "mappings": {
    "dynamic": false,
    "properties": {
      "user": {
        "type": "object",
        "properties": {
          "id": { "type": "keyword" },
          "tags": { "type": "keyword" }
        }
      }
    }
  }
}
```

**`dataType.toGraphQL()`** — the nested object becomes its own generated type:

```graphql
type DTAccountUserV1 {
  id: String
  tags: [String]
}

type Account {
  user: DTAccountUserV1
}
```

**`dataType.toXlucene()`** — nested fields keep their dot-notation paths:

```json
{
  "user": "object",
  "user.id": "string",
  "user.tags": "string"
}
```
