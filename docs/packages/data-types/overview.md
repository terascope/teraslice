---
title: Data Types
sidebar_label: Overview
---

> A library for defining the data structures and mapping, exports to Opensearch Mappings, GraphQL, xLucene, and more.

## What is a data type?

A data type is a declarative, versioned description of the shape of a record —
one schema definition that every other layer of the stack is generated from. It is
a plain object (`DataTypeConfig`) holding a `version` and a `fields` map
of field names → field configs.

```ts
{
    version: 1,
    fields: {
        name: { type: FieldType.Keyword },
        'name.tokens': { type: FieldType.Text },
        created: { type: FieldType.Date, is_primary_date: true },
        location: { type: FieldType.GeoPoint },
        tags: { type: FieldType.Keyword, array: true },
    },
}
```

Wrapping that config in a [`DataType`](./api/data-type/classes/DataType.md) validates
it and gives you the conversion functions needed for use throughout teraslice:

| Function | Produces | Used for |
| ------ | -------- | -------- |
| `toESMapping()` | Elasticsearch/OpenSearch `mappings` + `settings` | creating indices, analyzers, `knn` settings |
| `toGraphQL()` | a GraphQL schema (types, input types, scalars) | serving the data over an API |
| `toXlucene()` | an xLucene type config | parsing and translating user queries |

The conversions are also target-aware: `toESMapping()` takes `distribution`,
`majorVersion`, and `minorVersion`, so one data type can emit the right mapping for
whichever cluster you're pointing at.

### Field configs carry more than a type

Each entry in `fields` is a `DataTypeFieldConfig`, and `type` is its only required
key. All other keys refine how the field is indexed and described. Which of these a field actually honors depends on its type. See [Field Configuration](./field-configs.md) for what each option does and where it is valid.

### Nested structure

Nested objects are declared **flat, with dot-notation** field names (`user`,
`user.id`, `user.tags`) rather than by nesting configs. On construction, an `Object`
or `Tuple` field and its children are grouped together, and each output format
re-assembles them appropriately — nested `properties` in a mapping, a generated
child type in GraphQL, dotted paths in xLucene. See
[Nested objects](#nested-objects).

### Where data types are used

The same config is consumed across the stack: `elasticsearch-store` /
`opensearch-client` build index mappings and templates from a `DataType`,
`xlucene-translator` uses the xLucene config to validate and translate queries,
and `data-mate` uses it to type, coerce, and aggregate `DataFrame` columns.

## Installation

```bash
# Using pnpm
pnpm add @terascope/data-types
# Using npm
npm install --save @terascope/data-types
```

## Field Types

Each field in a `DataTypeConfig` is declared with a `FieldType`. These describe what a
value *means*, so they are more specific than the storage types they map to —
`Hostname`, `Domain`, and `Keyword` are three distinct field types that all end up as
a string, and that extra meaning is what lets mapping generation, query translation,
and coercion each do the right thing with them. Several types are also composites: one
declaration can emit a primary field, sub-fields, and the custom
analyzers/tokenizers or index settings they depend on.

The types are grouped below by purpose; follow a link for the full
mapping/GraphQL/xLucene details of each.

### Numeric

- [`Byte`](./api/types/v1/byte/classes/default.md)
- [`Short`](./api/types/v1/short/classes/default.md)
- [`Integer`](./api/types/v1/integer/classes/default.md)
- [`Long`](./api/types/v1/long/classes/default.md)
- [`Float`](./api/types/v1/float/classes/default.md)
- [`Double`](./api/types/v1/double/classes/default.md)
- [`Number`](./api/types/v1/number/classes/default.md)

### String / keyword / text

See [Choosing a string type](#choosing-a-string-type) below for how to pick between these.

- [`Keyword`](./api/types/v1/keyword/classes/default.md)
- [`String`](./api/types/v1/string/classes/default.md)
- [`Text`](./api/types/v1/text/classes/default.md)
- [`KeywordCaseInsensitive`](./api/types/v1/keyword-case-insensitive/classes/default.md)
- [`KeywordTokens`](./api/types/v1/keyword-tokens/classes/default.md)
- [`KeywordTokensCaseInsensitive`](./api/types/v1/keyword-tokens-case-insensitive/classes/default.md)
- [`KeywordPathAnalyzer`](./api/types/v1/keyword-path-analyzer/classes/default.md)
- [`NgramTokens`](./api/types/v1/ngram-tokens/classes/default.md)

### Boolean / binary

- [`Boolean`](./api/types/v1/boolean/classes/default.md)
- [`Binary`](./api/types/v1/binary/classes/default.md)

### Date

- [`Date`](./api/types/v1/date/classes/default.md)

### Geo

- [`GeoPoint`](./api/types/v1/geo-point/classes/default.md)
- [`GeoJSON`](./api/types/v1/geo-json/classes/default.md)
- [`Boundary`](./api/types/v1/boundary/classes/default.md)
- [`Geo`](./api/types/v1/geo/classes/default.md) — **deprecated**; use `GeoPoint` or `GeoJSON`.

### Network

- [`IP`](./api/types/v1/ip/classes/default.md)
- [`IPRange`](./api/types/v1/ip-range/classes/default.md)
- [`Hostname`](./api/types/v1/hostname/classes/default.md)
- [`Domain`](./api/types/v1/domain/classes/default.md)

### Complex / other

- [`Object`](./api/types/v1/object/classes/default.md)
- [`Vector`](./api/types/v1/vector/classes/default.md)
- [`Any`](./api/types/v1/any/classes/default.md)
- [`Tuple`](./api/types/tuple-type/classes/default.md)

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
| [`string`](./api/types/v1/string/classes/default.md) | Same as `keyword`, but no special `_key` treatment | `keyword` | ✅ | — |
| [`text`](./api/types/v1/text/classes/default.md) | Free-form prose you search over | `text` (standard analyzer) | — | words |
| [`keyword-tokens`](./api/types/v1/keyword-tokens/classes/default.md) | Need exact match *and* word search on one field | `keyword` + `tokens` text sub-field | ✅ | words (on `.tokens`) |
| [`keyword-case-insensitive`](./api/types/v1/keyword-case-insensitive/classes/default.md) | Exact match ignoring case | `text` w/ `lowercase_keyword_analyzer` (or `keyword` + sub-field via `use_fields_hack`) | ✅ (case-insensitive) | — |
| [`keyword-tokens-case-insensitive`](./api/types/v1/keyword-tokens-case-insensitive/classes/default.md) | Case-insensitive exact *and* word search | `text` w/ `lowercase_keyword_analyzer` + `tokens` sub-field | ✅ (case-insensitive) | words (on `.tokens`) |
| [`keyword-path-analyzer`](./api/types/v1/keyword-path-analyzer/classes/default.md) | Slash-delimited paths, match by segment | `keyword` + `tokens` sub-field (`/` pattern analyzer) | ✅ | path segments (on `.tokens`) |
| [`ngram-tokens`](./api/types/v1/ngram-tokens/classes/default.md) | Substring matches on numeric strings | `keyword` + `tokens` sub-field (3-gram, digits only) | ✅ | substrings (on `.tokens`) |
| [`hostname`](./api/types/v1/hostname/classes/default.md) | Hostnames, case-insensitive + per-label | `text` w/ `lowercase_keyword_analyzer` + `tokens` sub-field (`.` pattern) | ✅ (case-insensitive) | labels (on `.tokens`) |
| [`domain`](./api/types/v1/domain/classes/default.md) | Domain names, match by suffix | `text` w/ `lowercase_keyword_analyzer` + `tokens` and `right` sub-fields | ✅ (case-insensitive) | suffixes (on `.right`), words (on `.tokens`) |

All of these map to the GraphQL `String` scalar — except a `keyword` field named
`_key`, see below. For xLucene, the plain `keyword`/`text`/tokenized variants
report `String`; `keyword-case-insensitive` and `domain` report `AnalyzedString`.

## The `_key` field

`_key` is the convention across Teraslice for a record's unique identifier. Several packages have specific behaviors related to this field name:

- In data-types the `keyword` type gives a field named `_key` special treatment: it maps to the GraphQL `ID` scalar instead of `String`. The ES/OpenSearch mapping (`keyword`) and xLucene type (`String`) are unchanged.

```ts
const dataType = new DataType({
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        name: { type: FieldType.Keyword },
    },
}, 'Person');

dataType.toGraphQL();
// type Person {
//   _key: ID
//   name: String
// }
```

- A core-utils [`DataEntity`](../../jobs/data-entities.md) stores the record's unique key in its metadata as `_key`, readable and writable via `getKey()`/`setKey()`. Elasticsearch/OpenSearch readers populate it from the document's `_id`.

- `IndexModel` in [`elasticsearch-store`](../elasticsearch-store/overview.md)
  uses `_key` as its `id_field` — an autogenerated unique ID stored on the
  record that also serves as the document `_id`.

Because of its special treatment of `_key`, the `keyword` type is always preferred over the `string` type.

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
