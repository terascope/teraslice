---
title: Field Configuration
sidebar_label: Field Config
---

Every entry in a data type's `fields` map is a `DataTypeFieldConfig`. Only `type`
is required; the remaining options refine how the field is indexed, described,
and coerced.

```ts
{
    version: 1,
    fields: {
        created: {
            type: FieldType.Date,       // required
            format: 'yyyy-MM-dd',       // Date only
            is_primary_date: true,      // Date only
            time_resolution: 'seconds', // Date only
            description: 'when the record was created',
        },
    },
}
```

Not every option applies to every field type. Some are read by
`@terascope/data-types` when generating output; others are ignored here and only
consumed downstream by `data-mate`.

## Options

| Option | Value | Valid for | Affects |
| ------ | ----- | --------- | ------- |
| `type` | `FieldType` | all fields, **required** | every output |
| `array` | `boolean` | honored by every field type; **required to be `true`** on [`Vector`](./api/types/v1/vector/classes/default.md) | GraphQL (list), ES mapping for [`Object`](./api/types/v1/object/classes/default.md) only |
| `description` | `string` | all types | GraphQL only |
| `indexed` | `boolean` | see [below](#indexed) | ES mapping only |
| `format` | `string` | [`Date`](./api/types/v1/date/classes/default.md) only | ES mapping only |
| `is_primary_date` | `boolean` | `Date` only | nothing in this package; read by `data-mate` |
| `time_resolution` | `'seconds'` \| `'milliseconds'` | `Date` only | nothing in this package |
| `locale` | BCP 47 tag | not consumed by this package | random-data generation only |
| `use_fields_hack` | `boolean` | [`KeywordCaseInsensitive`](./api/types/v1/keyword-case-insensitive/classes/default.md) only | ES mapping + xLucene |
| `dimension` | `integer` | `Vector` only, **required**  | ES mapping |
| `space_type` | see [Vector options](#vector-options) | `Vector` only | ES mapping |
| `name` | `'hnsw'` \| `'ivf'` | `Vector` only | ES mapping |
| `engine` | `'faiss'` \| `'lucene'` | `Vector` only | ES mapping |

`DataTypeFieldConfig` has an open index signature (`[extra: string]: unknown`),
so **unrecognized options are accepted and silently ignored** — as is an option
placed on a type that doesn't read it. `dimension: 5` on a `Keyword`, or
`format` on anything but a `Date`, produces no error and no output change. The
one thing validated at construction time is that each field name is legal and
has a `type`; everything else is validated (if at all) when a conversion runs.

### `array`

Marks the field as holding a list of values. Every field type honors it — the
list wrapper is applied by the shared base class, not per type — but its effect
is per-output:

- **GraphQL** — the field becomes a list: `tags: [String]`.
- **ES/OpenSearch** — no change for most types, because Elasticsearch has no
  separate array type; any field may hold an array of its mapped type. The
  exception is `Object`, where `array: true` switches the mapping from
  `object` to `nested`, preserving each element's independence for querying
  (an `object` array flattens its values across elements).
- **xLucene** — no change.

```ts
{ meta: { type: FieldType.Object, array: true }, 'meta.a': { type: FieldType.Keyword } }
```

```json
{ "meta": { "type": "nested", "properties": { "a": { "type": "keyword" } } } }
```

Two types deserve care:

- `Vector` **requires** `array: true`; `toESMapping()` throws `A vector must be
  marked as an array` without it.
- `Boundary` is *already* a GraphQL list — a boundary is a pair of points, so it
  renders as `[DTGeoBoundaryV1]` on its own. Adding `array: true` wraps it again
  into `[[DTGeoBoundaryV1]]` (a list of boundaries).

### `description`

Free text carried into the generated GraphQL schema as a docstring. It has no
effect on the ES mapping or xLucene config.

```ts
{ tags: { type: FieldType.Keyword, array: true, description: 'the tags' } }
```

```graphql
type T {
  """
  the tags
  """
  tags: [String]
}
```

### `indexed`

Defaults to `true`. Setting `indexed: false` keeps the value in `_source` but
takes it out of the index, so it can't be searched, sorted, or aggregated on.
**How that is expressed — and whether it is allowed at all — depends on the
type:**

| Behavior | Types | Emitted |
| -------- | ----- | ------- |
| `index: false` added to the mapping | `Byte`, `Short`, `Integer`, `Long`, `Float`, `Double`, `Number`, `Keyword`, `String`, `Text`, `Boolean`, `Binary`, `Date`, `IP`, `IPRange`, `GeoPoint`, `Geo` | `{ "type": "keyword", "index": false }` |
| `enabled: false` added instead | `Object`, `Boundary` | `{ "type": "object", "enabled": false }` |
| No effect — already excluded from indexing | `Any`, `Tuple` | `{ "enabled": false }` regardless |
| **Throws** | `Domain`, `GeoJSON`, `Hostname`, `KeywordCaseInsensitive`, `KeywordPathAnalyzer`, `KeywordTokens`, `KeywordTokensCaseInsensitive`, `NgramTokens`, `Vector` | `<Type> is required to be indexed` |

The types that throw are listed in `indexedRequiredFieldTypes` in
`@terascope/types` — they either depend on a custom analyzer or use a mapping
that cannot meaningfully be excluded from indexing. The error is raised by
`toESMapping()`,
not by the `DataType` constructor, so an invalid combination is only surfaced
when you generate a mapping.

### `format` (Date)

The date format, either a member of the `DateFormat` enum (`iso_8601`,
`epoch`, `epoch_millis`, `seconds`, `milliseconds`) or a custom
[date-fns](https://date-fns.org/docs/format) pattern.

It reaches the ES mapping only when Elasticsearch can act on it — a custom
pattern, or an epoch format normalized to what ES understands. `iso_8601` is
ES's default and is dropped:

| `format` | ES mapping |
| -------- | ---------- |
| `'iso_8601'` | `{ "type": "date" }` — omitted |
| *(unset)* | `{ "type": "date" }` |
| `'seconds'` | `{ "type": "date", "format": "epoch" }` |
| `'milliseconds'` | `{ "type": "date", "format": "epoch_millis" }` |
| `'epoch'` / `'epoch_millis'` | passed through unchanged |
| `'yyyy-MM-dd'` | `{ "type": "date", "format": "yyyy-MM-dd" }` |

GraphQL always renders a `Date` field as `String`, and xLucene as `date`,
regardless of format.

### `is_primary_date` and `time_resolution`

`is_primary_date` marks the record's main date field, and `time_resolution`
(`'seconds'` or `'milliseconds'`) declares its precision — it is documented as
being used *with* `is_primary_date` rather than on its own. Neither changes any
output of this package; they are metadata for consumers:

- `data-mate` sets a `DataEntity`'s event time from the `is_primary_date`
  column when serializing `DataFrame` rows — and only when that column is a
  date, which is what confines the option to `Date` fields in practice.
- It is also the conventional marker for the date field that timeseries index
  names are derived from.

Nothing enforces any of this. Only one field should carry `is_primary_date`,
but a config with several is accepted; setting it on a non-`Date` field is
accepted and ignored.

### `locale`

A BCP 47 language tag. It is not read by `@terascope/data-types` at all. Treat it as metadata for downstream consumers.

### `use_fields_hack` (KeywordCaseInsensitive)

A temporary flag, valid only on `KeywordCaseInsensitive`. By default that type
maps to an analyzed `text` field, which means it can't be sorted or aggregated
on. Setting the flag maps a real `keyword` instead and moves the analyzer to a
`.text` sub-field, so you keep exact-value sorting and aggregations while still
matching case-insensitively on the sub-field.

| | Default | `use_fields_hack: true` |
| --- | --- | --- |
| ES mapping | `{ "type": "text", "analyzer": "lowercase_keyword_analyzer" }` | `{ "type": "keyword", "fields": { "text": { "type": "text", "analyzer": "lowercase_keyword_analyzer" } } }` |
| xLucene | `AnalyzedString` (`~string`) | `String` |
| Query against | the field itself | `field` exact, `field.text` case-insensitive |

Either way, the mapping's `settings` gain the `lowercase_keyword_analyzer`
definition (a `keyword` tokenizer plus a `lowercase` filter).

### Vector options

`Vector` fields take four extra options beyond the required `array: true`:

| Option | Default | Valid values |
| ------ | ------- | ------------ |
| `dimension` | *(required)* | any integer — the vector length |
| `space_type` | `'l2'` | `l1`, `l2`, `linf`, `cosinesimil`, `innerproduct`, `hamming`, `hammingbit` |
| `name` | `'hnsw'` | `hnsw`, `ivf` — the ANN algorithm |
| `engine` | `'faiss'` | `faiss`, `lucene` |

```ts
{
    embedding: {
        type: FieldType.Vector,
        array: true,
        dimension: 768,
        space_type: 'cosinesimil',
    },
}
```

`toESMapping()` validates all of these and throws on: a missing or non-integer
`dimension`, an invalid `space_type` / `name` / `engine`, the conflicting pair
`engine: 'lucene'` with `name: 'ivf'`, a missing `array: true`, or an OpenSearch
version below 2.10. The generated mapping also differs by version —
`space_type` sits at the top level for OpenSearch 3.x and above, and inside
`method` for earlier versions — and the field contributes an `index.knn: true`
index setting.
